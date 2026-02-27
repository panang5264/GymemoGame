const errorHandler = (err, req, res, next) => {
    let statusCode = res.statusCode === 200 ? 500 : res.statusCode
    let message = err.message || 'เกิดข้อผิดพลาดในระบบ'

    // Mongoose bad ObjectId
    if (err.name === 'CastError') {
        message = `ไม่พบข้อมูลที่ร้องขอ. (ID: ${err.value})`
        statusCode = 404
    }

    // Mongoose duplicate key
    if (err.code === 11000) {
        message = 'ข้อมูลนี้มีอยู่ในระบบแล้ว'
        statusCode = 400
    }

    // Mongoose validation error
    if (err.name === 'ValidationError') {
        const errors = Object.values(err.errors).map(val => val.message)
        message = 'ข้อมูลไม่ถูกต้อง: ' + errors.join(', ')
        statusCode = 400
    }

    // JWT Errors
    if (err.name === 'JsonWebTokenError') {
        message = 'โทเคนไม่ถูกต้อง กรุณาเข้าสู่ระบบใหม่'
        statusCode = 401
    }

    res.status(statusCode).json({
        success: false,
        message,
        error: process.env.NODE_ENV === 'development' ? err.stack : undefined
    })
}

module.exports = { errorHandler }
