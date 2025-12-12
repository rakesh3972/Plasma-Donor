# Plasma Donor - Complete Flow Test Plan

## 🎯 **Test Scenario: End-to-End Donation Request Flow**

### **Step 1: User Registration & Setup**
1. **Register as Donor**
   - Create account with role: 'donor'
   - Set blood group: 'O+'
   - Set location with lat/lng
   - Verify user is saved correctly

2. **Register as Requester**
   - Create account with role: 'requester'
   - Set blood group: 'A+'
   - Set location with lat/lng
   - Verify user is saved correctly

### **Step 2: Search & Request Flow**
1. **Requester Searches for Donors**
   - Login as requester
   - Go to Search page
   - Search for blood group 'A+'
   - Verify donors are found
   - Check console logs for search parameters

2. **Requester Sends Request**
   - Click "Request Plasma" on a compatible donor
   - Verify request is created in database
   - Check server logs for request creation
   - Verify notification is sent to donor

### **Step 3: Donor Receives & Confirms Request**
1. **Donor Checks Dashboard**
   - Login as donor
   - Go to Donor Dashboard
   - Check "Nearby Requests" section
   - Verify request appears in list
   - Check console logs for nearby requests

2. **Donor Confirms Request**
   - Click "Confirm Request" on compatible request
   - Verify request status changes to 'accepted'
   - Check server logs for confirmation
   - Verify notification is sent to requester

### **Step 4: Chat & Communication**
1. **Both Users Can Chat**
   - Verify confirmed request appears in "Confirmed Requests"
   - Click "Chat" button
   - Verify chat interface opens
   - Test message sending/receiving

## 🔍 **Debugging Checklist**

### **Server Console Logs to Check:**
- ✅ `Creating request:` - When requester sends request
- ✅ `Getting nearby requests for donor:` - When donor loads dashboard
- ✅ `Found pending requests:` - Shows number of requests found
- ✅ `Confirming request:` - When donor confirms request
- ✅ `Request confirmed successfully` - When confirmation succeeds

### **Browser Console Logs to Check:**
- ✅ `Search parameters:` - When requester searches
- ✅ `Search response:` - Shows found donors
- ✅ `Nearby requests:` - When donor loads dashboard
- ✅ `Confirming request for requester:` - When confirm is clicked

### **Database Checks:**
- ✅ DonationHistory collection has new request
- ✅ Request status changes from 'pending' to 'accepted'
- ✅ Notification collection has entries
- ✅ User documents have correct roles and locations

## 🚨 **Common Issues & Solutions**

### **Issue 1: Donor Not Seeing Requests**
**Check:**
- Donor has location set
- Request was created with correct donorId
- Request status is 'pending'
- Distance calculation is working

### **Issue 2: Confirm Button Not Working**
**Check:**
- Correct requesterId is being passed
- Blood group compatibility check
- Request exists in database
- User authentication is working

### **Issue 3: Chat Not Working**
**Check:**
- Request status is 'accepted'
- Both users can access chat
- Socket.io connection is established

## ✅ **Expected Results**

### **Successful Flow:**
1. Requester finds donors ✅
2. Request is created ✅
3. Donor sees request in dashboard ✅
4. Donor confirms request ✅
5. Both users can chat ✅
6. Notifications are sent ✅

### **Error Handling:**
- Incompatible blood groups show error ✅
- Missing location shows appropriate message ✅
- Network errors show user-friendly messages ✅

## 🎉 **Flow Status: READY FOR TESTING**

All components are properly connected and the flow should work end-to-end. 