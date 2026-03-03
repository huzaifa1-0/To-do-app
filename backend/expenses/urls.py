from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import ExpenseViewSet, TodayExpenseTotalView

router = DefaultRouter()
router.register(r'', ExpenseViewSet, basename='expense')

urlpatterns = [
    # Today Total Expense
    path('today-total/', TodayExpenseTotalView.as_view(), name='today-total'),
    
    # DRF Router endpoints (CRUD) -> /api/expenses/ and /api/expenses/<id>/
    path('', include(router.urls)),
]
