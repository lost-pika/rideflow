const userModel = require('../models/user.model');


module.exports.createUser = async ({
    fullname, email, password
}) => {
    if (!fullname || !email || !password) {
        throw new Error('All fields are required');
    }

    const { firstname, lastname } = fullname;
    if (!firstname || !lastname) {
        throw new Error('First name and last name are required');
    }
    const user = userModel.create({
        fullname: {
            firstname,
            lastname
        },
        email,
        password
    })

    return user;
}// ye user ko create karega
// is particular function ka sirf ek kaam hai user ko create karna