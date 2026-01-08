const express = require('express');
const { body, validationResult } = require('express-validator');
const { Op } = require('sequelize');
const Product = require('../models/Product');
const Order = require('../models/Order');
const RepairBooking = require('../models/RepairBooking');
const User = require('../models/User');
const { adminAuth } = require('../middleware/adminAuth');
const smsService = require('../services/smsService');

const router = express.Router();

// @route   GET /api/admin/dashboard
// @desc    Get admin dashboard stats
// @access  Private (Admin only)
router.get('/dashboard', adminAuth, async (req, res) => {
  try {
    // Use Sequelize count methods
    const totalUsers = await User.count({ where: { role: 'user' } });
    const totalOrders = await Order.count();
    const totalBookings = await RepairBooking.count();
    const totalProducts = await Product.count();

    // Get recent orders (simplified for now)
    const recentOrders = await Order.findAll({
      limit: 5,
      order: [['createdAt', 'DESC']],
      include: [{
        model: User,
        as: 'user',
        attributes: ['name', 'email']
      }]
    });

    // Get recent bookings
    const recentBookings = await RepairBooking.findAll({
      limit: 10,
      order: [['createdAt', 'DESC']],
      include: [{
        model: User,
        as: 'user',
        attributes: ['name', 'email'],
        required: false // LEFT JOIN for guest bookings
      }]
    });

    res.json({
      success: true,
      stats: {
        totalUsers,
        totalOrders,
        totalBookings,
        totalProducts
      },
      recentOrders,
      recentBookings
    });
  } catch (error) {
    console.error('[ADMIN DASHBOARD ERROR]', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error loading dashboard',
      error: error.message 
    });
  }
});

// @route   GET /api/admin/bookings
// @desc    Get all repair bookings
// @access  Private (Admin only)
router.get('/bookings', adminAuth, async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    
    const where = {};
    if (status) where.status = status;

    const offset = (page - 1) * limit;

    const { count, rows: bookings } = await RepairBooking.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']],
      include: [{
        model: User,
        as: 'user',
        attributes: ['name', 'email', 'phone'],
        required: false // LEFT JOIN for guest bookings
      }]
    });

    res.json({
      success: true,
      bookings,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(count / limit),
        total: count
      }
    });
  } catch (error) {
    console.error('[ADMIN BOOKINGS ERROR]', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error loading bookings',
      error: error.message 
    });
  }
});

// @route   PUT /api/admin/bookings/:id
// @desc    Update repair booking
// @access  Private (Admin only)
router.put('/bookings/:id', adminAuth, async (req, res) => {
  try {
    const { status, estimatedCost, adminNotes } = req.body;

    const booking = await RepairBooking.findByPk(req.params.id);
    if (!booking) {
      return res.status(404).json({ 
        success: false,
        message: 'Booking not found' 
      });
    }

    const oldStatus = booking.status;
    
    // Update booking fields
    const updateData = {};
    if (status) updateData.status = status;
    if (estimatedCost) {
      updateData.estimatedCost = estimatedCost;
      updateData.totalCost = parseFloat(estimatedCost) + parseFloat(booking.serviceFee || 0);
    }
    if (adminNotes) updateData.adminNotes = adminNotes;

    await booking.update(updateData);

    // Send SMS notification if status changed
    let smsNotification = 'No SMS sent';
    if (status && status !== oldStatus) {
      try {
        const smsResult = await smsService.sendBookingStatusUpdate(booking, status);
        console.log('📱 SMS Notification Result:', smsResult);
        
        if (smsResult.success) {
          console.log(`✅ SMS sent to ${booking.customerName} (${booking.customerPhone})`);
          smsNotification = 'SMS notification sent';
        } else {
          console.log(`❌ SMS failed for ${booking.customerName}: ${smsResult.error}`);
          smsNotification = 'SMS failed to send';
        }
      } catch (smsError) {
        console.error('SMS Service Error:', smsError);
        smsNotification = 'SMS service error';
      }
    }

    res.json({
      success: true,
      message: 'Booking updated successfully',
      booking,
      smsNotification
    });
  } catch (error) {
    console.error('[ADMIN BOOKING UPDATE ERROR]', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error updating booking',
      error: error.message 
    });
  }
});

// @route   POST /api/admin/send-sms
// @desc    Send custom SMS to customer
// @access  Private (Admin only)
router.post('/send-sms', [
  adminAuth,
  body('phone').notEmpty().withMessage('Phone number is required'),
  body('customerName').notEmpty().withMessage('Customer name is required'),
  body('message').notEmpty().withMessage('Message is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false,
        errors: errors.array() 
      });
    }

    const { phone, customerName, message } = req.body;

    const smsResult = await smsService.sendCustomMessage(phone, customerName, message);

    if (smsResult.success) {
      res.json({
        success: true,
        message: 'SMS sent successfully',
        details: smsResult
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Failed to send SMS',
        error: smsResult.error
      });
    }
  } catch (error) {
    console.error('[SEND SMS ERROR]', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error sending SMS',
      error: error.message 
    });
  }
});

// @route   DELETE /api/admin/bookings/:id
// @desc    Delete repair booking (admin can delete any booking)
// @access  Private (Admin only)
router.delete('/bookings/:id', adminAuth, async (req, res) => {
  try {
    const booking = await RepairBooking.findByPk(req.params.id);
    if (!booking) {
      return res.status(404).json({ 
        success: false,
        message: 'Booking not found' 
      });
    }

    // Admin can delete any booking regardless of status
    await booking.destroy();

    res.json({
      success: true,
      message: 'Booking deleted successfully'
    });
  } catch (error) {
    console.error('[ADMIN BOOKING DELETE ERROR]', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error deleting booking',
      error: error.message 
    });
  }
});

module.exports = router;