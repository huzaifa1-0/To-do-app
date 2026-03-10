from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from .views import (
    RegisterView, PasswordResetRequestView, PasswordResetVerifyView, PasswordResetConfirmView,
    InviteEmployeeView, AcceptInvitationView, EmployeeListView, AssignMoneyView,
    CustomTokenObtainPairView
)

urlpatterns = [
    # Auth Endpoints
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('login/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # Password Reset Flow
    path('password-reset/', PasswordResetRequestView.as_view(), name='password_reset_request'),
    path('password-reset/verify/', PasswordResetVerifyView.as_view(), name='password_reset_verify'),
    path('password-reset/confirm/', PasswordResetConfirmView.as_view(), name='password_reset_confirm'),

    # Invitation & Employee Management
    path('invite/', InviteEmployeeView.as_view(), name='invite_employee'),
    path('accept-invite/', AcceptInvitationView.as_view(), name='accept_invite'),
    path('employees/', EmployeeListView.as_view(), name='employee_list'),
    path('assign-money/', AssignMoneyView.as_view(), name='assign_money'),
]
