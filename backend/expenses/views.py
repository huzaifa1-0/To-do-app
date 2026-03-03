from rest_framework import viewsets
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from django.db.models import Sum, Count
from django.utils import timezone
from datetime import timedelta, datetime
import pytz

from .models import Expense
from .serializers import ExpenseSerializer


# 1️⃣ Expense Data Isolation ViewSet
class ExpenseViewSet(viewsets.ModelViewSet):
    serializer_class = ExpenseSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = Expense.objects.filter(
            user=self.request.user
        ).order_by('-created_at')

        filter_param = self.request.query_params.get('filter')
        category = self.request.query_params.get('category')
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

        if category:
            queryset = queryset.filter(category=category)

        if start_date and end_date:
            try:
                start_dt = timezone.make_aware(datetime.strptime(start_date, '%Y-%m-%d'))
                end_dt = timezone.make_aware(datetime.strptime(end_date, '%Y-%m-%d'))
                queryset = queryset.filter(created_at__range=[start_dt, end_dt])
            except ValueError:
                pass

        return queryset

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


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
        ).values('category').annotate(
            total=Sum('amount'),
            count=Count('id')
        ).order_by('-total')

        return Response(list(summary))