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
    PasswordResetRequestSerializer, PasswordResetVerifySerializer, PasswordResetConfirmSerializer
)

User = get_user_model()

# 1. Registration View
class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = (AllowAny,)
    serializer_class = RegisterSerializer

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
