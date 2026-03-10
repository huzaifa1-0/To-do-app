from django.db import models
from django.conf import settings
from django.core.exceptions import ValidationError
import re
import datetime

class Category(models.Model):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True, null=True)

    def __cl__(self):
        return self.name

    def __str__(self):
        return self.name

    class Meta:
        verbose_name_plural = "Categories"

class UserCategoryBudget(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="budgets"
    )
    category = models.ForeignKey(Category, on_delete=models.CASCADE)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('user', 'category')

    def __str__(self):
        return f"{self.user.email} - {self.category.name}: {self.amount}"

class Expense(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="expenses"
    )

    def clean_description(self):
        if self.description:
            # Simple sanitization: remove common script injection patterns
            self.description = re.sub(r'<script.*?>.*?</script>', '', self.description, flags=re.IGNORECASE)
            self.description = re.sub(r'on\w+=".*?"', '', self.description, flags=re.IGNORECASE)
        return self.description

    def save(self, *args, **kwargs):
        self.clean_description()
        super().save(*args, **kwargs)

    # Temporary choices until migration logic is settled, 
    # but we will transition to ForeignKey to Category
    category_name = models.CharField(max_length=50, blank=True, null=True) 
    category = models.ForeignKey(
        Category, 
        on_delete=models.PROTECT, 
        related_name="expenses",
        null=True, # Allow null for migration purposes
        blank=True
    )

    title = models.CharField(max_length=255)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    description = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.title} - {self.amount}"

class Income(models.Model):
    STATUS_CHOICES = (
        ('Pending', 'Pending'),
        ('Received', 'Received'),
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="incomes"
    )
    source = models.CharField(max_length=255)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    expected_date = models.DateField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Pending')
    created_at = models.DateTimeField(auto_now_add=True)

    def clean(self):
        super().clean()
        if self.expected_date:
            if self.expected_date.year < 2000 or self.expected_date.year > 2100:
                raise ValidationError("Please select a valid year between 2000 and 2100.")
            if self.status == 'Pending' and self.expected_date < datetime.date.today():
                raise ValidationError("Upcoming income date cannot be in the past.")

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.source} - {self.amount} - {self.status}"

class FutureExpense(models.Model):
    STATUS_CHOICES = (
        ('Planned', 'Planned'),
        ('Confirmed', 'Confirmed'),
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="future_expenses"
    )
    title = models.CharField(max_length=255)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    expected_date = models.DateField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Planned')
    created_at = models.DateTimeField(auto_now_add=True)

    def clean(self):
        super().clean()
        if self.expected_date:
            if self.expected_date.year < 2000 or self.expected_date.year > 2100:
                raise ValidationError("Please select a valid year between 2000 and 2100.")
            if self.status == 'Planned' and self.expected_date < datetime.date.today():
                raise ValidationError("Future expense date cannot be in the past.")

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.title} - {self.amount} - {self.status}"