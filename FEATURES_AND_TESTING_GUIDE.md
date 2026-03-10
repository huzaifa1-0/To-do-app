# The Manager - App Features & QA Requirements

**App Name:** The Manager (Daily Expense Tracker)  
**Backend:** Railways  
**Frontend:** Netlify  
**Date:** March 9, 2026

---

## 1️⃣ FEATURE: User Registration (Sign Up)

### What It Does:
Users create a new account by providing email, password, first name, and last name.

### Expected Behavior:
- User can sign up with unique email
- Password is securely stored
- Account is immediately active
- User can then login with this account

### How to Test It (Step-by-Step):

**Test Case 1: Successful Signup**
1. Open app in browser
2. Click "Sign Up" button
3. Fill in:
   - First Name: "John"
   - Last Name: "Doe"
   - Email: "john@example.com"
   - Password: "SecurePass123!"
   - Confirm Password: "SecurePass123!"
4. Click "Create Account" button
5. ✅ Should show success message
6. ✅ Should redirect to Login page

**Test Case 2: Email Already Exists**
1. Try to sign up with email "john@example.com" (already used)
2. ❌ Should show error: "Email already registered"
3. Cannot create duplicate account

**Test Case 3: Passwords Don't Match**
1. Enter different password and confirm password
2. ❌ Should show error: "Passwords do not match"
3. Cannot submit form

**Test Case 4: Missing Required Fields**
1. Leave First Name empty, fill other fields
2. ❌ Should show error: "First Name is required"
3. Same for other required fields

**Test Case 5: Invalid Email Format**
1. Enter "notanemail" (no @)
2. ❌ Should show error: "Enter a valid email address"

**Test Case 6: Weak Password**
1. Enter password "123" (too weak)
2. ⚠️ Should show warning: "Password is too weak"

### Acceptance Criteria (How to Know It's Working):
- ✅ Account created with valid data
- ✅ Email is unique (no duplicates)
- ✅ Password properly validated
- ✅ Validation messages appear for errors
- ✅ Redirect to login after success
- ✅ Cannot create account with invalid data

---

## 2️⃣ FEATURE: User Login

### What It Does:
Users enter email and password to access their account.

### Expected Behavior:
- Valid credentials → Dashboard opens
- Invalid credentials → Error message
- Session stays active until logout

### How to Test It (Step-by-Step):

**Test Case 1: Successful Login**
1. Go to login page
2. Enter email: "john@example.com"
3. Enter password: "SecurePass123!"
4. Click "Sign In" button
5. ✅ Should redirect to Dashboard
6. ✅ Should see your expenses

**Test Case 2: Wrong Password**
1. Enter email: "john@example.com"
2. Enter password: "WrongPassword123!"
3. Click "Sign In"
4. ❌ Should show error: "Invalid email or password"
5. Stay on login page

**Test Case 3: Email Doesn't Exist**
1. Enter email: "nonexistent@example.com"
2. Enter correct password
3. ❌ Should show error: "Invalid email or password"
4. Cannot login

**Test Case 4: Empty Email**
1. Leave email empty
2. Enter password
3. Click "Sign In"
4. ❌ Should show error: "Email is required"

**Test Case 5: Empty Password**
1. Enter email
2. Leave password empty
3. ❌ Should show error: "Password is required"

**Test Case 6: Network Error During Login**
1. Turn off internet
2. Try to login
3. ⚠️ Should show: "Network error. Check your connection"
4. Turn internet back on and retry

### Acceptance Criteria:
- ✅ Valid credentials allow login
- ✅ Invalid password shows error
- ✅ Non-existent email shows error
- ✅ Session is created after login
- ✅ Logout button available after login
- ✅ User data visible only after login

---

## 3️⃣ FEATURE: Password Reset

### What It Does:
Users who forget their password can reset it using a 6-digit OTP (One-Time Password) sent to their email.

### Expected Behavior:
- User requests password reset
- Email with OTP is sent
- User verifies OTP
- User sets new password
- Old password no longer works

### How to Test It (Step-by-Step):

**Test Case 1: Complete Password Reset Flow**

**Step 1: Request OTP**
1. On login page, click "Forgot Password?"
2. Enter email: "john@example.com"
3. Click "Send OTP"
4. ✅ Should show: "OTP sent to your email"
5. ✅ Check email inbox for OTP (e.g., "Your OTP is: 123456")

**Step 2: Verify OTP**
1. You should see "Enter OTP" form
2. Copy OTP from email (e.g., "123456")
3. Paste into OTP field
4. Click "Verify"
5. ✅ Should show: "OTP verified successfully"

**Step 3: Set New Password**
1. Should see "New Password" form
2. Enter new password: "NewSecurePass123!"
3. Confirm password: "NewSecurePass123!"
4. Click "Reset Password"
5. ✅ Should show: "Password reset successful"
6. ✅ Redirect to login page

**Step 4: Verify Old Password Doesn't Work**
1. Go to login
2. Enter email: "john@example.com"
3. Enter old password: "SecurePass123!"
4. ❌ Should fail: "Invalid email or password"

**Step 5: Login with New Password**
1. Enter email: "john@example.com"
2. Enter new password: "NewSecurePass123!"
3. ✅ Should login successfully

**Test Case 2: Wrong OTP**
1. Request password reset
2. Enter wrong OTP (e.g., "000000")
3. ❌ Should show: "Invalid OTP"
4. Cannot proceed

**Test Case 3: Expired OTP (After 15 minutes)**
1. Request password reset
2. Wait 15 minutes
3. Try to enter OTP
4. ❌ Should show: "OTP has expired"
5. Need to request new OTP

**Test Case 4: Resend OTP**
1. Request password reset
2. Didn't receive email? Click "Resend OTP"
3. ✅ Should send new OTP
4. Use new OTP to verify

### Acceptance Criteria:
- ✅ OTP sent to correct email
- ✅ Valid OTP allows password change
- ✅ Invalid OTP rejected
- ✅ Old password stops working
- ✅ New password works for login
- ✅ OTP expires after 15 minutes

---

## 4️⃣ FEATURE: Create & View Expenses

### What It Does:
Users can record what they spent money on (e.g., "Coffee $5").

### Expected Behavior:
- User adds expense with title, amount, category
- Expense appears in dashboard
- User can see list of all expenses
- Amount is deducted from their balance

### How to Test It (Step-by-Step):

**Test Case 1: Create Simple Expense**
1. Login to dashboard
2. Click "Add Expense" button
3. Fill in:
   - Title: "Coffee"
   - Amount: "5.50"
   - Category: "Food" (from dropdown)
4. Click "Add" button
5. ✅ Should see expense in list: "Coffee - 5.50"
6. ✅ Today's total should increase by 5.50

**Test Case 2: Create Expense with Description**
1. Click "Add Expense"
2. Fill in:
   - Title: "Grocery Shopping"
   - Amount: "45.75"
   - Category: "Shopping"
   - Description: "Weekly groceries from supermarket"
3. ✅ Should save and appear in list

**Test Case 3: Create Expense Without Category**
1. Click "Add Expense"
2. Fill in:
   - Title: "Random expense"
   - Amount: "10.00"
   - Leave Category empty
3. ✅ Should still save (category is optional)

**Test Case 4: Amount = 0**
1. Try to create expense with Amount: "0"
2. ❌ Should show error: "Amount must be greater than 0"

**Test Case 5: Negative Amount**
1. Try to create with Amount: "-50"
2. ❌ Should show error: "Amount cannot be negative"

**Test Case 6: Decimal Places**
1. Create expense with Amount: "5.99" (2 decimal places)
2. ✅ Should save correctly as 5.99

**Test Case 7: Empty Title**
1. Leave Title empty, fill other fields
2. ❌ Should show error: "Title is required"

**Test Case 8: Very Large Amount**
1. Create expense with Amount: "999999.99"
2. ✅ Should accept and save

### Acceptance Criteria:
- ✅ Can add expense with title and amount
- ✅ Amount can have 2 decimal places
- ✅ Zero and negative amounts rejected
- ✅ Category is optional
- ✅ Expense appears immediately in list
- ✅ Balance updates correctly
- ✅ All required fields validated

---

## 5️⃣ FEATURE: View & Filter Expenses

### What It Does:
Users can see all their expenses and filter them by date, category, or time period (today, week, month).

### Expected Behavior:
- Users see only their own expenses
- Can filter by time period
- Can filter by category
- Can filter by date range

### How to Test It (Step-by-Step):

**Test Case 1: View All Expenses**
1. Login to dashboard
2. ✅ Should see list of all expenses
3. Sorted by newest first

**Test Case 2: Filter by "Today"**
1. Click filter dropdown
2. Select "Today"
3. ✅ Should show only expenses created today
4. ❌ Should NOT show expenses from yesterday or 1 week ago

**Test Case 3: Filter by "This Week"**
1. Select "This Week" filter
2. ✅ Should show expenses from Monday to Sunday
3. ❌ Should NOT show expenses from last week

**Test Case 4: Filter by "This Month"**
1. Select "This Month" filter
2. ✅ Should show all expenses in current month (March)
3. ❌ Should NOT show February or April expenses

**Test Case 5: Filter by Category**
1. Click category filter
2. Select "Food"
3. ✅ Should show only Food expenses
4. ❌ Should NOT show Transport or Entertainment

**Test Case 6: Filter by Date Range**
1. Select custom date range
2. Start: "March 1, 2026"
3. End: "March 10, 2026"
4. ✅ Should show expenses only between these dates

**Test Case 7: Multiple Filters Together**
1. Filter by "Food" category AND "This Week"
2. ✅ Should show only Food expenses from this week
3. Narrow down results correctly

**Test Case 8: Clear Filters**
1. Apply some filters
2. Click "Clear Filters"
3. ✅ Should show all expenses again

### Acceptance Criteria:
- ✅ Can view all personal expenses
- ✅ Time filters (today, week, month) work correctly
- ✅ Category filter works
- ✅ Date range filter works
- ✅ Multiple filters work together
- ✅ Cannot see other users' expenses

---

## 6️⃣ FEATURE: Edit & Delete Expenses

### What It Does:
Users can modify or remove expense records.

### Expected Behavior:
- User can edit amount, category, description
- User can delete expense
- Deleted amount is added back to balance

### How to Test It (Step-by-Step):

**Test Case 1: Edit Expense Amount**
1. Find an expense in list
2. Click "Edit" button
3. Change amount from "5.50" to "10.00"
4. Click "Save"
5. ✅ Expense should show new amount "10.00"
6. ✅ Today's total should increase by 4.50

**Test Case 2: Edit Expense Category**
1. Click "Edit" on expense
2. Change category from "Food" to "Shopping"
3. Click "Save"
4. ✅ Category should update in list

**Test Case 3: Edit Expense Description**
1. Click "Edit"
2. Update description
3. ✅ New description saves

**Test Case 4: Delete Expense**
1. Find expense "Coffee - 5.50"
2. Click "Delete" button
3. ✅ Should ask confirmation: "Are you sure?"
4. Click "Yes, Delete"
5. ✅ Expense should disappear from list
6. ✅ Amount should be added back to balance

**Test Case 5: Cancel Delete**
1. Click "Delete"
2. Confirmation appears
3. Click "Cancel"
4. ✅ Expense should still be in list

**Test Case 6: Edit Deleted Expense**
1. Delete an expense
2. Try to access it directly (via URL)
3. ❌ Should show error: "Expense not found"

### Acceptance Criteria:
- ✅ Can edit amount, category, description
- ✅ Changes save and reflect immediately
- ✅ Can delete with confirmation
- ✅ Deleted amount refunded to balance
- ✅ Cannot edit other users' expenses
- ✅ Cannot edit non-existent expense

---

## 7️⃣ FEATURE: View Dashboard Summary

### What It Does:
Dashboard shows quick overview of spending:
- Today's total expenses
- Total balance remaining
- Monthly spending limit
- Category breakdown chart

### Expected Behavior:
- Summary cards show correct calculations
- Chart shows spending by category

### How to Test It (Step-by-Step):

**Test Case 1: Today's Total Card**
1. Create 3 expenses today: $5, $10, $15
2. ✅ Card should show "Today's Total: $30"

**Test Case 2: Total Balance Card**
1. Login with account that has balance
2. ✅ Should show current balance available
3. Create new expense
4. ✅ Balance should decrease

**Test Case 3: Monthly Limit Card**
1. Check if monthly limit is set
2. ✅ Should display monthly limit (e.g., "$5000")
3. Graph shows how much spent vs. limit

**Test Case 4: Category Breakdown**
1. Create expenses in different categories:
   - Food: $50
   - Transport: $30
   - Entertainment: $20
2. ✅ Chart should show percentages:
   - Food: 50%
   - Transport: 30%
   - Entertainment: 20%

### Acceptance Criteria:
- ✅ Today's total calculates correctly
- ✅ Balance updates after expenses
- ✅ Monthly limit displays
- ✅ Category chart is accurate
- ✅ All calculations are correct

---

## 8️⃣ FEATURE: Manage Budget

### What It Does:
Employers can set spending limits for themselves and employees per category.

### Expected Behavior:
- Employer can set budget per category
- User cannot exceed category budget
- Warning when approaching limit
- Error when exceeding limit

### How to Test It (Step-by-Step):

**Test Case 1: Employer Sets Category Budget**
1. Login as employer
2. Go to "Budget" tab
3. Click "Set Budget"
4. Select category: "Food"
5. Enter amount: "$100"
6. Click "Save"
7. ✅ Should show "Food budget set to $100"

**Test Case 2: Employee Cannot Exceed Budget**
1. Employee has Food budget: $100
2. Employee creates expenses:
   - Expense 1: $60 (Food)
   - Expense 2: $40 (Food) - Total: $100 ✅
   - Expense 3: $10 (Food) - Try to add
3. ❌ Should show error: "Food budget exceeded"
4. Cannot create expense

**Test Case 3: Budget Warning**
1. Employee has Food budget: $100
2. Create Food expense: $80
3. Try to create another Food expense: $25 (would exceed)
4. ⚠️ Should show warning: "Almost at limit (80% used)"
5. Can still create if explicitly confirm

**Test Case 4: View Budget Status**
1. Go to Budget tab
2. ✅ Should see:
   - Category name
   - Allocated budget: $100
   - Already spent: $80
   - Remaining: $20
   - Progress bar showing 80% used

### Acceptance Criteria:
- ✅ Can set budget per category
- ✅ Cannot exceed category budget
- ✅ Warning shown when approaching limit
- ✅ Error shown when exceeding limit
- ✅ Budget status displays remaining amount
- ✅ Only applies to employees with assigned budgets

---

## 9️⃣ FEATURE: Employee & Employer Management

### What It Does:
Employers can invite employees, assign budgets, and monitor their spending.

### Expected Behavior:
- Employer invites employee by email
- Employee accepts invitation
- Employer can assign money and budgets to employee
- Employer can view employee's expenses

### How to Test It (Step-by-Step):

**Test Case 1: Invite Employee**
1. Login as employer: "boss@company.com"
2. Go to "Employees" or "Teams" tab
3. Click "Invite Employee"
4. Enter email: "worker@company.com"
5. Click "Send Invite"
6. ✅ Should show: "Invitation sent"
7. ✅ Employee should receive email with invitation link

**Test Case 2: Employee Accepts Invitation**
1. Employee receives email
2. Email contains link: "http://app.com/signup?invite_token=xxx"
3. Employee clicks link
4. Should go to signup page with token pre-filled
5. Employee signs up as normal
6. ✅ After signup, employee is automatically linked to employer
7. Dashboard shows employer's name

**Test Case 3: Assign Money to Employee**
1. Login as employer
2. View "Employees" list
3. Find employee: "worker@company.com"
4. Click "Assign Budget"
5. Enter amount: "$500"
6. Click "Assign"
7. ✅ Employee should see balance: "$500"
8. ✅ Employee receives email notification

**Test Case 4: Assign Category Budget to Employee**
1. Click "Assign Budget"
2. Select category: "Food"
3. Enter amount: "$100"
4. Click "Assign"
5. ✅ Employee can only spend $100 on Food
6. ✅ Employer sees budget allocation

**Test Case 5: View Employee List**
1. Login as employer
2. Go to "Employees"
3. ✅ Should see all employees:
   - Name, Email
   - Amount assigned
   - Amount spent
   - Remaining balance
4. Example: "John Doe - Assigned: $500 | Spent: $120 | Remaining: $380"

**Test Case 6: View Employee Expenses**
1. Click on employee in list
2. ✅ Should see all expenses created by that employee
3. Can see date, amount, category

**Test Case 7: Duplicate Invitation**
1. Try to invite same email twice
2. ❌ Should show error: "Already invited" or "Already an employee"

### Acceptance Criteria:
- ✅ Can invite employee by email
- ✅ Invitation email sent with valid link
- ✅ Employee can accept and link to employer
- ✅ Can assign budget to employee
- ✅ Budget limits are enforced
- ✅ Can view all employees and their expenses
- ✅ Cannot invite same email twice

---

## 🔟 FEATURE: Income & Future Expenses

### What It Does:
Users can track expected income and planned future expenses.

### Expected Behavior:
- Create income record with source and expected date
- Mark income as received
- Create future expense with expected date
- Change status from Planned to Confirmed

### How to Test It (Step-by-Step):

**Test Case 1: Create Income Record**
1. Go to "Income" tab
2. Click "Add Income"
3. Fill in:
   - Source: "Salary"
   - Amount: "$5000"
   - Expected Date: "March 15, 2026"
   - Status: "Pending"
4. Click "Save"
5. ✅ Should appear in Income list

**Test Case 2: Mark Income as Received**
1. Find income record: "Salary"
2. Status shows: "Pending"
3. Click "Mark as Received"
4. ✅ Status changes to "Received"

**Test Case 3: Create Future Expense**
1. Go to "Future Expenses" tab
2. Click "Add Future Expense"
3. Fill in:
   - Title: "New Laptop"
   - Amount: "$50000"
   - Expected Date: "April 30, 2026"
   - Status: "Planned"
4. Click "Save"
5. ✅ Should appear in Future Expenses list

**Test Case 4: Change Future Expense Status**
1. Find future expense: "New Laptop"
2. Status shows: "Planned"
3. Click "Confirm"
4. ✅ Status changes to "Confirmed"

### Acceptance Criteria:
- ✅ Can create income with source and date
- ✅ Can mark income as received
- ✅ Can create future expense with date
- ✅ Can change status (Planned → Confirmed)
- ✅ Income/Future expenses separate from actual expenses

---

## 1️⃣1️⃣ FEATURE: User Profile & Settings

### What It Does:
Users can view and update their profile information.

### Expected Behavior:
- User can see their profile
- User can update name, email
- User can change password
- User can logout

### How to Test It (Step-by-Step):

**Test Case 1: View Profile**
1. Click user menu (top right)
2. Select "Profile"
3. ✅ Should show:
   - First Name: "John"
   - Last Name: "Doe"
   - Email: "john@example.com"

**Test Case 2: Edit Name**
1. In profile, click "Edit"
2. Change name to "Jane"
3. Click "Save"
4. ✅ Should show success message
5. ✅ Dashboard should show new name

**Test Case 3: Change Password**
1. In profile, click "Change Password"
2. Enter current password
3. Enter new password
4. Confirm new password
5. Click "Update"
6. ✅ Should show success message
7. ✅ Need to login again with new password

**Test Case 4: Logout**
1. Click user menu
2. Select "Logout"
3. ✅ Redirect to login page
4. ✅ Cannot access dashboard without re-logging in

### Acceptance Criteria:
- ✅ Can view profile information
- ✅ Can edit name
- ✅ Can change password
- ✅ Can logout
- ✅ Changes persist after refresh

---

## 🔐 SECURITY TESTS

### Test Case 1: Data Isolation
1. Login as User A
2. Try to directly access User B's expense: `/expenses/999/` (B's ID)
3. ❌ Should show error: "Not found" or "Forbidden"
4. Cannot see other users' data

### Test Case 2: Session Security
1. Login as User A
2. Open browser DevTools → Application → Cookies/Storage
3. ✅ Should see auth token/session
4. Logout
5. ✅ Token should be deleted
6. Cannot use old token

### Test Case 3: Invalid Token
1. Manually delete auth token from storage
2. Try to use app
3. ❌ Should redirect to login
4. ✅ Cannot access protected pages

### Test Case 4: CSRF Protection
1. Submit forms from external website
2. ❌ Should be rejected (if CSRF enabled)

### Test Case 5: SQL Injection
1. In expense title, enter: `'; DROP TABLE expenses; --`
2. ❌ Should be treated as plain text, not executed
3. No harm to database

---

## 📱 BROWSER & DEVICE TESTS

### Desktop Browser (Chrome)
- [ ] Login works
- [ ] All features accessible
- [ ] No console errors (F12)
- [ ] Charts/graphs display

### Desktop Browser (Firefox)
- [ ] Same as Chrome

### Tablet (iPad size)
- [ ] Layout responsive
- [ ] Touch buttons work
- [ ] Forms usable

### Mobile (iPhone size)
- [ ] Mobile layout correct
- [ ] Buttons large enough to tap
- [ ] Scrolling smooth
- [ ] No horizontal scroll

---

## ⚡ PERFORMANCE TESTS

### Test Case 1: Page Load Speed
- Dashboard should load in < 3 seconds
- Expense list should load in < 2 seconds

### Test Case 2: Large Data Set
- With 1000+ expenses
- Filtering still fast
- No lag when scrolling

### Test Case 3: Slow Network
- Simulate 3G network
- App should still work (may be slow)
- Loading indicators show progress

---

## 📊 SUMMARY TABLE

| Feature | Test Cases | Status |
|---------|-----------|--------|
| Registration | 6 | ⏳ To Test |
| Login | 6 | ⏳ To Test |
| Password Reset | 4 | ⏳ To Test |
| Create Expenses | 8 | ⏳ To Test |
| View/Filter Expenses | 8 | ⏳ To Test |
| Edit/Delete Expenses | 6 | ⏳ To Test |
| Dashboard Summary | 4 | ⏳ To Test |
| Budget Management | 4 | ⏳ To Test |
| Employee Management | 7 | ⏳ To Test |
| Income/Future | 4 | ⏳ To Test |
| Profile & Settings | 4 | ⏳ To Test |
| Security | 5 | ⏳ To Test |
| Browser/Device | 5 | ⏳ To Test |
| Performance | 3 | ⏳ To Test |
| **TOTAL** | **73 Test Cases** | **⏳ To Test** |

---

## 🎯 HOW TO USE THIS DOCUMENT

1. **Pick one feature** (e.g., "Create Expenses")
2. **Follow the step-by-step test cases**
3. **Check ✓ if it works**
4. **Mark ❌ if it fails** and note the issue
5. **Note any error messages** that appear
6. **Move to next feature** when done

---

## 📝 ISSUE REPORTING TEMPLATE

When you find a bug:

```
Feature: [e.g., Create Expenses]
Test Case: [e.g., Test Case 3: Create Expense Without Category]
Steps:
1. ...
2. ...

Expected: [What should happen]
Actual: [What actually happened]
Error Message: [If any]
Screenshots: [Attach]
Severity: Critical / High / Medium / Low
```

---

**Send this to your QA engineer and they'll know exactly what to test! 🎯**
