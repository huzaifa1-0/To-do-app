from django.shortcuts import render
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from django.db.models import Sum
from django.utils import timezone
from datetime import timedelta, datetime
from .models import Expense
from .serializers import ExpenseSerializer
from nlp_processor import parse_expense_text

@api_view(['GET', 'POST'])
def expense_list_create(request):
    if request.method == 'POST':
        serializer = ExpenseSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    # GET request - listing and filtering
    queryset = Expense.objects.all()
    filter_param = request.query_params.get('filter')
    category = request.query_params.get('category')
    
    # Optional: Custom date range
    start_date = request.query_params.get('start')
    end_date = request.query_params.get('end')

    today = timezone.now().date()

    if filter_param == 'today':
        # Use date extraction compatible with SQLite
        from django.db.models import DateField
        from django.db.models.functions import Cast
        # Filter by casting datetime to date and comparing
        queryset = queryset.extra(where=["date(date_field) = date(%s)"], params=[today.isoformat()])
    elif filter_param == 'week':
        # Calculate the start of the week (Monday) and end of the week (Sunday)
        week_start = today - timedelta(days=today.weekday())
        week_end = week_start + timedelta(days=6)
        # Use raw SQL for SQLite compatibility
        queryset = queryset.extra(
            where=["date(date_field) BETWEEN date(%s) AND date(%s)"],
            params=[week_start.isoformat(), week_end.isoformat()]
        )
    elif filter_param == 'month':
        # Use raw SQL for SQLite compatibility to filter by year and month
        queryset = queryset.extra(
            where=["strftime('%%Y', date_field) = %s AND strftime('%%m', date_field) = %s"],
            params=[str(today.year), str(today.month).zfill(2)]
        )
    elif category:
        # Filter by category
        queryset = queryset.filter(category=category)
    elif start_date and end_date:
        # Convert string dates to datetime if needed
        try:
            start_dt = timezone.make_aware(datetime.strptime(start_date, '%Y-%m-%d')) if start_date else None
            end_dt = timezone.make_aware(datetime.strptime(end_date, '%Y-%m-%d')) if end_date else None
            if start_dt and end_dt:
                queryset = queryset.filter(date_field__range=[start_dt, end_dt])
        except ValueError:
            # If date parsing fails, ignore the filters
            pass
    elif start_date or end_date:
        # Handle case where only start or end date is provided
        if start_date:
            try:
                start_dt = timezone.make_aware(datetime.strptime(start_date, '%Y-%m-%d'))
                queryset = queryset.filter(date_field__gte=start_dt)
            except ValueError:
                pass
        if end_date:
            try:
                end_dt = timezone.make_aware(datetime.strptime(end_date, '%Y-%m-%d'))
                queryset = queryset.filter(date_field__lte=end_dt)
            except ValueError:
                pass

    serializer = ExpenseSerializer(queryset, many=True)
    return Response(serializer.data)

@api_view(['GET'])
def expense_summary(request):
    summary = Expense.objects.values('category').annotate(total=Sum('amount'))
    return Response(summary)

@api_view(['GET'])
def expense_total(request):
    total = Expense.objects.aggregate(total_spending=Sum('amount'))
    return Response(total)



@api_view(['POST'])
def process_ai_expense(request):
    """Takes a natural language string, processes it with AI, and saves it."""
    user_text = request.data.get('text')
    
    if not user_text:
        return Response({"error": "No text provided"}, status=status.HTTP_400_BAD_REQUEST)
        
    # 1. Pass the text to your AI engine
    ai_result = parse_expense_text(user_text)
    
    if "error" in ai_result:
        return Response(ai_result, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
    # 2. Map the AI result to your friend's Serializer
    serializer_data = {
        'amount': ai_result['amount'],
        'category': ai_result['category'],
        'description': ai_result['description']
    }
    
    # 3. Save to PostgreSQL
    serializer = ExpenseSerializer(data=serializer_data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
        
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
