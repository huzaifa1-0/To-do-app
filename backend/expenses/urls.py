from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    ExpenseViewSet, 
    TodayExpenseTotalView, 
    TotalSpendingView, 
    CategorySummaryView, 
    AIProcessExpenseView,
    BudgetStatusView
)

router = DefaultRouter()
router.register(r'', ExpenseViewSet, basename='expense')

urlpatterns = [
    # Today Total Expense
    path('today-total/', TodayExpenseTotalView.as_view(), name='today-total'),
    
    # Total All-Time Spending
    path('total/', TotalSpendingView.as_view(), name='total-spending'),
    
    # Category Summary
    path('summary/', CategorySummaryView.as_view(), name='category-summary'),
    
    # Budget Status
    path('budget-status/', BudgetStatusView.as_view(), name='budget-status'),
    
    # AI NLP Processor
    path('ai-process/', AIProcessExpenseView.as_view(), name='ai-process'),
    
    # DRF Router endpoints (CRUD) -> /api/expenses/ and /api/expenses/<id>/
    path('', include(router.urls)),
]
