from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.db.models import Sum
from .models import User
from expenses.models import Expense

class ExpenseInline(admin.TabularInline):
    model = Expense
    extra = 0
    readonly_fields = ('created_at',)
    fields = ('title', 'amount', 'category', 'created_at')
    can_delete = True

@admin.register(User)
class UserAdmin(BaseUserAdmin):
    # The forms to add and change user instances
    # These are needed if you want to use the default Django UserAdmin forms
    # with a custom User model.
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Personal info', {'fields': ('first_name', 'last_name')}),
        ('Permissions', {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Important dates', {'fields': ('last_login', 'date_joined')}),
    )
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'first_name', 'last_name', 'password', 'is_staff', 'is_active'),
        }),
    )

    list_display = ('email', 'first_name', 'last_name', 'get_total_expenses', 'date_joined', 'is_staff')
    list_filter = ('is_staff', 'is_superuser', 'is_active', 'date_joined')
    search_fields = ('email', 'first_name', 'last_name')
    ordering = ('email',)
    inlines = [ExpenseInline]

    def get_queryset(self, request):
        queryset = super().get_queryset(request)
        queryset = queryset.annotate(
            _total_expenses=Sum('expenses__amount')
        )
        return queryset

    def get_total_expenses(self, obj):
        # Using the annotated value from get_queryset for performance
        return obj._total_expenses or 0
    
    get_total_expenses.short_description = 'Total Expenses'
    get_total_expenses.admin_order_field = '_total_expenses'
