from django.contrib import admin
from .models import Expense, Category, UserCategoryBudget

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'description')
    search_fields = ('name',)

@admin.register(UserCategoryBudget)
class UserCategoryBudgetAdmin(admin.ModelAdmin):
    list_display = ('user', 'category', 'amount', 'updated_at')
    list_filter = ('category', 'user')
    search_fields = ('user__email', 'category__name')

@admin.register(Expense)
class ExpenseAdmin(admin.ModelAdmin):
    list_display = ('title', 'user', 'amount', 'category', 'created_at')
    list_filter = ('category', 'created_at', 'user')
    search_fields = ('title', 'description', 'user__email', 'category__name')
    date_hierarchy = 'created_at'
    ordering = ('-created_at',)
