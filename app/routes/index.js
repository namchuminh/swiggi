const categoryRoute = require("./category.routes.js");
const foodRoute = require("./food.routes.js");
const toppingRoute = require("./topping.routes.js");
const foodToppingRoute = require("./foodTopping.routes.js");
const couponRoute = require("./coupon.routes.js");
const userRoute = require("./user.routes.js");
const authRoute = require("./auth.routes.js")
const configRoute = require("./config.routes.js")

function route(app){
    app.use("/categories", categoryRoute);
    app.use("/foods", foodRoute);
    app.use("/toppings", toppingRoute);
    app.use("/foods/topping", foodToppingRoute);
    app.use("/coupons", couponRoute);
    app.use("/users", userRoute);
    app.use("/configs", configRoute);
    app.use("/", authRoute);
    app.use("/", (req, res) => {
        return res.status(200).json({ message: 'Trang chủ API 111' });
    });
}

module.exports = route