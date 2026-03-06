from rest_framework.decorators import action
from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from django.db.models import Sum, Count, F
from django.utils import timezone
from datetime import timedelta, datetime
from decimal import Decimal
import pytz

from .models import Expense, Category, UserCategoryBudget, Income, FutureExpense
from .serializers import ExpenseSerializer, IncomeSerializer, FutureExpenseSerializer


def check_budget(user, category, amount_to_add):
    """
    Utility function to check if an expense exceeds the remaining budget.
    Returns (is_allowed, error_message)
    """
    if not user.employer:
        return True, ""
        
    try:
        amount_to_add = Decimal(str(amount_to_add))
    except (TypeError, ValueError):
        amount_to_add = Decimal('0.00')

    # Overall assigned budget check
    total_spent_overall = Expense.objects.filter(user=user).aggregate(total=Sum('amount'))['total']
    total_spent_overall = total_spent_overall or Decimal('0.00')
    assigned_amount = user.assigned_amount or Decimal('0.00')
    
    remaining_overall = assigned_amount - total_spent_overall
    if amount_to_add > remaining_overall:
        return False, "This expense cannot be added because it exceeds your total allocated budget."

    if not category:
        return True, ""
        
    budget = UserCategoryBudget.objects.filter(user=user, category=category).first()
    if not budget:
        # If no specific category budget is set, assume it's allowed (as long as overall was okay)
        return True, ""
        
    total_spent_cat = Expense.objects.filter(
        user=user, 
        category=category
    ).aggregate(total=Sum('amount'))['total']
    total_spent_cat = total_spent_cat or Decimal('0.00')
    
    remaining_cat = (budget.amount or Decimal('0.00')) - total_spent_cat
    
    if amount_to_add > remaining_cat:
        return False, "This expense cannot be added because the allocated budget for this category has been exceeded."
    
    return True, ""


# 1️⃣ Expense Data Isolation ViewSet
class ExpenseViewSet(viewsets.ModelViewSet):
    serializer_class = ExpenseSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = Expense.objects.filter(
            user=self.request.user
        ).order_by('-created_at')

        filter_param = self.request.query_params.get('filter')
        category_name = self.request.query_params.get('category')
        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')

        today = timezone.now().date()

        if filter_param == 'today':
            queryset = queryset.filter(created_at__date=today)

        elif filter_param == 'week':
            week_start = today - timedelta(days=today.weekday())
            week_end = week_start + timedelta(days=6)
            queryset = queryset.filter(created_at__date__range=[week_start, week_end])

        elif filter_param == 'month':
            queryset = queryset.filter(
                created_at__year=today.year,
                created_at__month=today.month
            )

        if category_name:
            queryset = queryset.filter(category__name=category_name)

        if start_date and end_date:
            try:
                start_dt = timezone.make_aware(datetime.strptime(start_date, '%Y-%m-%d'))
                end_dt = timezone.make_aware(datetime.strptime(end_date, '%Y-%m-%d'))
                queryset = queryset.filter(created_at__range=[start_dt, end_dt])
            except ValueError:
                pass

        return queryset

    def perform_create(self, serializer):
        category = serializer.validated_data.get('category')
        amount = serializer.validated_data.get('amount')
        
        is_allowed, error_msg = check_budget(self.request.user, category, amount)
        if not is_allowed:
            from rest_framework.exceptions import ValidationError
            raise ValidationError(error_msg)
            
        expense = serializer.save(user=self.request.user)
        
        # Deduct from user's balance
        user = self.request.user
        user.total_balance -= Decimal(str(amount))
        user.save(update_fields=['total_balance'])

    def perform_destroy(self, instance):
        amount = instance.amount
        user = instance.user
        
        # Add back to user's balance
        user.total_balance += Decimal(str(amount))
        user.save(update_fields=['total_balance'])
        
        instance.delete()

# 2️⃣ 12 AM PKT Daily Reset View
class TodayExpenseTotalView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        pkt_tz = pytz.timezone('Asia/Karachi')
        now_in_pkt = timezone.now().astimezone(pkt_tz)

        start_of_today_pkt = now_in_pkt.replace(
            hour=0, minute=0, second=0, microsecond=0
        )

        result = Expense.objects.filter(
            user=request.user,
            created_at__gte=start_of_today_pkt
        ).aggregate(total=Sum('amount'))

        total_amount = result['total'] or 0.0

        return Response({
            "today_total": total_amount,
            "total_balance": request.user.total_balance,
            "currency": "PKR"
        })


# 3️⃣ Total All-Time Spending View
class TotalSpendingView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        result = Expense.objects.filter(
            user=request.user
        ).aggregate(total=Sum('amount'))

        total_amount = result['total'] or 0.0

        return Response({
            "total_spending": total_amount,
            "currency": "PKR"
        })


# 4️⃣ Category Summary View
class CategorySummaryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        summary = Expense.objects.filter(
            user=request.user
        ).values('category__name').annotate(
            category=F('category__name'),
            total=Sum('amount'),
            count=Count('id')
        ).order_by('-total')

        return Response(list(summary))


# 5️⃣ Budget Status View
class BudgetStatusView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        budgets = UserCategoryBudget.objects.filter(user=request.user).select_related('category')
        
        status_data = []
        for budget in budgets:
            spent = Expense.objects.filter(
                user=request.user, 
                category=budget.category
            ).aggregate(total=Sum('amount'))['total'] or 0
            
            status_data.append({
                "category": budget.category.name,
                "allocated": budget.amount,
                "spent": spent,
                "remaining": budget.amount - spent
            })
            
        return Response(status_data)


import sys
from pathlib import Path
sys.path.append(str(Path(__file__).resolve().parent.parent))

try:
    from nlp_processor import parse_expense_text
except ImportError:
    # Fallback if module path issues
    def parse_expense_text(text):
        return {"error": "NLP Processor not found."}

# 6️⃣ AI Process Expense View
class AIProcessExpenseView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        text = request.data.get('text')
        if not text:
            return Response({"error": "No text provided."}, status=400)
        # 1. Get user's allocated categories
        if not request.user.employer:
            # Independent users can use any available category
            allowed_categories = list(Category.objects.values_list('name', flat=True))
        else:
            # Employees are restricted to categories they have budgets for
            user_budgets = UserCategoryBudget.objects.filter(user=request.user).select_related('category')
            allowed_categories = [b.category.name for b in user_budgets]
        
        # Always include 'Others' as a fallback
        if "Others" not in allowed_categories:
            allowed_categories.append("Others")

        # 2. Parse text with Groq AI using only allowed categories
        parsed_data = parse_expense_text(text, allowed_categories)
        
        if "error" in parsed_data:
            return Response(parsed_data, status=400)
            
        # 3. Guard against AI hallucinations: Ensure category is allowed
        cat_name = parsed_data.get('category')
        if cat_name not in allowed_categories:
            cat_name = "Others"
            
        category, _ = Category.objects.get_or_create(name=cat_name)
        amount = parsed_data.get('amount', 0.0)
        
        # Budget Validation
        is_allowed, error_msg = check_budget(request.user, category, amount)
        if not is_allowed:
            return Response({"error": error_msg}, status=400)
            
        # Create Expense
        try:
            expense_title = parsed_data.get('description', 'AI Expense')
            # If the description is long, we split it into title and description
            expense = Expense.objects.create(
                user=request.user,
                title=expense_title[:255], 
                amount=amount,
                category=category,
                description=expense_title if len(expense_title) > 255 else ''
            )
            
            # Deduct from total balance
            request.user.total_balance -= Decimal(str(amount))
            request.user.save(update_fields=['total_balance'])
        except Exception as e:
            return Response({"error": str(e)}, status=400)
            
        return Response({
            "message": "Expense successfully parsed and saved.",
            "data": ExpenseSerializer(expense).data
        }, status=201)

# 7️⃣ Income Management ViewSet
class IncomeViewSet(viewsets.ModelViewSet):
    serializer_class = IncomeSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Income.objects.filter(user=self.request.user).order_by('expected_date')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=True, methods=['post'])
    def receive(self, request, pk=None):
        income = self.get_object()
        if income.status == 'Received':
            return Response({"error": "Income is already marked as received."}, status=400)
            
        income.status = 'Received'
        income.save(update_fields=['status'])
        
        # Increase user total_balance
        user = request.user
        user.total_balance += Decimal(str(income.amount))
        user.save(update_fields=['total_balance'])
        
        return Response({"message": "Income received and balance updated.", "new_balance": user.total_balance})

# 8️⃣ Future Expense Planner ViewSet
class FutureExpenseViewSet(viewsets.ModelViewSet):
    serializer_class = FutureExpenseSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return FutureExpense.objects.filter(user=self.request.user).order_by('expected_date')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=True, methods=['post'])
    def confirm(self, request, pk=None):
        future_expense = self.get_object()
        if future_expense.status == 'Confirmed':
            return Response({"error": "Future expense is already confirmed."}, status=400)
            
        # Optional mapping of title to category. Let's create an "Others" category.
        category, _ = Category.objects.get_or_create(name="Others")
        
        # Check budget
        is_allowed, error_msg = check_budget(request.user, category, future_expense.amount)
        if not is_allowed:
            return Response({"error": error_msg}, status=400)
            
        future_expense.status = 'Confirmed'
        future_expense.save(update_fields=['status'])
        
        # Create an actual expense
        Expense.objects.create(
            user=request.user,
            title=future_expense.title,
            amount=future_expense.amount,
            category=category,
            description="Created from planned future expense"
        )
        
        # Deduct from user total_balance
        user = request.user
        user.total_balance -= Decimal(str(future_expense.amount))
        user.save(update_fields=['total_balance'])
        
        return Response({
            "message": "Future expense confirmed, recorded as reality, and balance updated.", 
            "new_balance": user.total_balance
        })
