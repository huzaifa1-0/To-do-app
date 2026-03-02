from django.shortcuts import render
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from django.db.models import Sum
from django.utils import timezone
from datetime import timedelta
from .models import Expense
from .serializers import ExpenseSerializer

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
    
    # Optional: Custom date range
    start_date = request.query_params.get('start')
    end_date = request.query_params.get('end')

    today = timezone.now().date()

    if filter_param == 'today':
        queryset = queryset.filter(date=today)
    elif filter_param == 'week':
        week_start = today - timedelta(days=today.weekday())
        queryset = queryset.filter(date__range=[week_start, today])
    elif filter_param == 'month':
        queryset = queryset.filter(date__month=today.month, date__year=today.year)
    elif start_date and end_date:
        queryset = queryset.filter(date__range=[start_date, end_date])

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
