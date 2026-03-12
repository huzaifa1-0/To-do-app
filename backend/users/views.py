from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny
from django.contrib.auth import get_user_model
from django.core.mail import send_mail
from django.utils.http import urlsafe_base64_encode
from django.utils.encoding import force_bytes
from django.contrib.auth.tokens import default_token_generator
from django.conf import settings

from .serializers import (
    RegisterSerializer, 
    PasswordResetRequestSerializer, PasswordResetVerifySerializer, PasswordResetConfirmSerializer,
    EmployeeSerializer, InvitationSerializer
)
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
import uuid

User = get_user_model()

# 1. Registration View
class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = (AllowAny,)
    serializer_class = RegisterSerializer

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        # Add custom claims
        token['session_token'] = user.session_token
        return token

    def validate(self, attrs):
        email = attrs.get("email")
        if email:
            import re
            email_regex = r'^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$'
            if not re.match(email_regex, email):
                raise serializers.ValidationError("Incorrect email format.")
        
        user = User.objects.filter(email=email).first()
        if user and not user.is_active:
             raise serializers.ValidationError("This account is inactive.")
        if not user:
             raise serializers.ValidationError("Account does not exist.")

        # Session Management: Generate a new session token on login
        session_token = str(uuid.uuid4())
        user.session_token = session_token
        user.save(update_fields=['session_token'])

        data = super().validate(attrs)
        
        data['session_token'] = session_token
        return data

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

import random
from .models import PasswordResetOTP

# 2. Password Reset Flow View
class PasswordResetRequestView(APIView):
    permission_classes = (AllowAny,)

    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data['email']
        user = User.objects.filter(email=email).first()
        
        if user:
            # Generate 6-digit OTP
            otp = f"{random.randint(100000, 999999)}"
            
            # Delete old OTP and create new one
            PasswordResetOTP.objects.filter(user=user).delete()
            PasswordResetOTP.objects.create(user=user, otp=otp)
            
            # Will output to Console due to EMAIL_BACKEND setting
            send_mail(
                "Your Password Reset OTP",
                f"Your password reset OTP is: {otp}\nIt is valid for 15 minutes.",
                "noreply@expenseapp.com",
                [user.email],
                fail_silently=False,
            )
        
        # Always return success to prevent Email Enumeration attacks
        return Response({"message": "If the email is registered, an OTP has been sent."}, status=status.HTTP_200_OK)


class PasswordResetVerifyView(APIView):
    permission_classes = (AllowAny,)

    def post(self, request):
        serializer = PasswordResetVerifySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        return Response({"message": "OTP verified successfully."}, status=status.HTTP_200_OK)


class PasswordResetConfirmView(APIView):
    permission_classes = (AllowAny,)

    def post(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        user = serializer.validated_data['user']
        
        user.set_password(serializer.validated_data['new_password'])
        user.save()
        
        # Delete OTP after successful reset
        PasswordResetOTP.objects.filter(user=user).delete()
        
        return Response({"message": "Password reset successful."}, status=status.HTTP_200_OK)

from rest_framework.permissions import IsAuthenticated
from django.db.models import Sum
from .models import Invitation
from decimal import Decimal, InvalidOperation
from expenses.models import Category, UserCategoryBudget

class InviteEmployeeView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        email = request.data.get('email')
        if not email:
            return Response({"error": "Email is required"}, status=status.HTTP_400_BAD_REQUEST)
            
        # Check if already invited or already an employee
        if User.objects.filter(email=email, employer=request.user).exists():
            return Response({"error": "User is already your employee."}, status=status.HTTP_400_BAD_REQUEST)
            
        invitation, created = Invitation.objects.get_or_create(
            employer=request.user, 
            email=email, 
            accepted=False
        )
        
        # Send Email
        invite_link = f"http://localhost:5173/signup?invite_token={invitation.token}"
        send_mail(
            "You are invited to join a Team Expense Workspace",
            f"{request.user.email} has invited you to manage your expenses.\nClick the link to sign up or log in: {invite_link}",
            "noreply@expenseapp.com",
            [email],
            fail_silently=False,
        )
        return Response({"message": "Invitation sent successfully."}, status=status.HTTP_200_OK)

class AcceptInvitationView(APIView):
    # This view might be called right after signup/login, so we need the user to be authenticated
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        token = request.data.get('token')
        if not token:
            return Response({"error": "Token is required"}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            invitation = Invitation.objects.get(token=token, accepted=False)
        except Invitation.DoesNotExist:
            return Response({"error": "Invalid or expired invitation token."}, status=status.HTTP_400_BAD_REQUEST)
            
        if invitation.email != request.user.email:
            return Response({"error": "This invitation is for a different email address."}, status=status.HTTP_400_BAD_REQUEST)
            
        request.user.employer = invitation.employer
        request.user.save()
        
        invitation.accepted = True
        invitation.save()
        
        return Response({"message": "Successfully joined the employer's workspace."}, status=status.HTTP_200_OK)

class EmployeeListView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        # Annotate total expenses
        employees = User.objects.filter(employer=request.user).annotate(
            total_expenses=Sum('expenses__amount')
        )
        
        data = []
        for emp in employees:
            total_exp = emp.total_expenses or 0
            data.append({
                "id": emp.id,
                "first_name": emp.first_name,
                "last_name": emp.last_name,
                "email": emp.email,
                "assigned_amount": emp.assigned_amount,
                "total_expenses": total_exp,
                "remaining_balance": (emp.assigned_amount or 0) - total_exp
            })
            
        return Response(data, status=status.HTTP_200_OK)

class AssignMoneyView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        employee_id = request.data.get('employee_id')
        amount_str = request.data.get('amount')
        category_name = request.data.get('category')
        
        if not employee_id or amount_str is None:
            return Response({"error": "Both employee_id and amount are required"}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            employee = User.objects.get(id=employee_id, employer=request.user)
        except User.DoesNotExist:
            return Response({"error": "Employee not found."}, status=status.HTTP_404_NOT_FOUND)
            
        try:
            amount = Decimal(str(amount_str))
        except (InvalidOperation, TypeError, ValueError):
            return Response({"error": "Invalid amount"}, status=status.HTTP_400_BAD_REQUEST)

        # Update base assigned amount
        if employee.assigned_amount is None:
            employee.assigned_amount = Decimal('0.00')
        
        employee.assigned_amount += amount
        employee.save() # This triggers the signal to send an email
        
        if category_name:
            category, _ = Category.objects.get_or_create(name=category_name)
            budget, created = UserCategoryBudget.objects.get_or_create(
                user=employee, category=category,
                defaults={'amount': Decimal('0.00')}
            )
            if budget.amount is None:
                budget.amount = Decimal('0.00')
            budget.amount += amount
            budget.save()
            
        return Response({
            "message": f"Successfully assigned Rs {amount} to {employee.email}.",
            "new_balance": employee.assigned_amount
        }, status=status.HTTP_200_OK)
