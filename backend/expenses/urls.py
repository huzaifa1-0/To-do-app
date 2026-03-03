from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import ExpenseViewSet, TodayExpenseTotalView, TotalSpendingView, CategorySummaryView

router = DefaultRouter()
router.register(r'', ExpenseViewSet, basename='expense')

urlpatterns = [
    # Today Total Expense
    path('today-total/', TodayExpenseTotalView.as_view(), name='today-total'),
    
    # Total All-Time Spending
    path('total/', TotalSpendingView.as_view(), name='total-spending'),
    
    # Category Summary
    path('summary/', CategorySummaryView.as_view(), name='category-summary'),
    
    # DRF Router endpoints (CRUD) -> /api/expenses/ and /api/expenses/<id>/
    path('', include(router.urls)),
]
