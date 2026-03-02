from django.urls import path
from . import views

urlpatterns = [
    path('', views.expense_list_create, name='expense-list-create'),
    path('summary/', views.expense_summary, name='expense-summary'),
    path('total/', views.expense_total, name='expense-total'),
]
