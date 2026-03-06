from rest_framework import serializers
from .models import Expense, Category, UserCategoryBudget, Income, FutureExpense

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name', 'description']

class UserCategoryBudgetSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    
    class Meta:
        model = UserCategoryBudget
        fields = ['id', 'user', 'category', 'category_name', 'amount', 'created_at', 'updated_at']
        read_only_fields = ['id', 'user', 'created_at', 'updated_at']

class ExpenseSerializer(serializers.ModelSerializer):
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(), 
        source='category', 
        required=False, 
        allow_null=True
    )
    category_name = serializers.CharField(source='category.name', read_only=True)

    class Meta:
        model = Expense
        fields = ['id', 'title', 'amount', 'category_id', 'category_name', 'description', 'created_at']
        read_only_fields = ['id', 'created_at', 'category_name']

    def validate_category_id(self, value):
        if value is None:
            raise serializers.ValidationError("Category is required.")
        return value

class IncomeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Income
        fields = ['id', 'user', 'source', 'amount', 'expected_date', 'status', 'created_at']
        read_only_fields = ['id', 'user', 'created_at']

class FutureExpenseSerializer(serializers.ModelSerializer):
    class Meta:
        model = FutureExpense
        fields = ['id', 'user', 'title', 'amount', 'expected_date', 'status', 'created_at']
        read_only_fields = ['id', 'user', 'created_at']