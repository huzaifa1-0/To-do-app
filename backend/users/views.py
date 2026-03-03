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
    PasswordResetRequestSerializer, PasswordResetConfirmSerializer
)

User = get_user_model()

# 1. Registration View
class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = (AllowAny,)
    serializer_class = RegisterSerializer

# 2. Password Reset Flow View
class PasswordResetRequestView(APIView):
    permission_classes = (AllowAny,)

    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data['email']
        user = User.objects.filter(email=email).first()
        
        if user:
            uid = urlsafe_base64_encode(force_bytes(user.pk))
            token = default_token_generator.make_token(user)
            reset_link = f"http://localhost:3000/reset-password?uid={uid}&token={token}" # Map to your React Route
            
            # Will output to Console due to EMAIL_BACKEND setting
            send_mail(
                "Password Reset Request",
                f"Click the link below to reset your password:\n{reset_link}",
                "noreply@expenseapp.com",
                [user.email],
                fail_silently=False,
            )
        
        # Always return success to prevent Email Enumeration attacks
        return Response({"message": "If the email is registered, a reset link has been sent."}, status=status.HTTP_200_OK)

class PasswordResetConfirmView(APIView):
    permission_classes = (AllowAny,)

    def post(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        uid = urlsafe_base64_decode(serializer.validated_data['uid']).decode()
        user = User.objects.get(pk=uid)
        
        user.set_password(serializer.validated_data['new_password'])
        user.save()
        return Response({"message": "Password reset successful."}, status=status.HTTP_200_OK)
