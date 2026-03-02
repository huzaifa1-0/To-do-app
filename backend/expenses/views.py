from django.shortcuts import render
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from django.db.models import Sum
from django.utils import timezone
from datetime import timedelta
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
        queryset = queryset.filter(date__date=today)
    elif filter_param == 'week':
        week_start = today - timedelta(days=today.weekday())
        queryset = queryset.filter(date__range=[week_start, today])
    elif filter_param == 'month':
        queryset = queryset.filter(date__month=today.month, date__year=today.year)
    elif category:
        # Filter by category
        queryset = queryset.filter(category=category)
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
