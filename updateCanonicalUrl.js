// updateCanonicalUrl.js
const mongoose = require("mongoose");
const Category = require("./models/Category"); // ✅ apna correct path lagana
require("dotenv").config();

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB connected");

    const categories = await Category.find();

    for (let cat of categories) {
      let updated = false;

      // agar canonicalUrl blank ya missing hai
      if (!cat.canonicalUrl || cat.canonicalUrl.trim() === "") {
        if (cat.slug) {
          cat.canonicalUrl = `https://www.trendikala.com/${cat.slug}`;
          updated = true;
        } else if (cat.name) {
          // agar slug missing hai to slugify name se banao
          const slugify = require("slugify");
          const slug = slugify(cat.name, { lower: true, strict: true });
          cat.slug = slug;
          cat.canonicalUrl = `https://www.trendikala.com/${slug}`;
          updated = true;
        }
      }

      if (updated) {
        await cat.save();
        console.log(`🟢 Updated canonical URL for: ${cat.name}`);
      }
    }

    console.log("🎉 All categories now have canonical URLs!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Error:", err);
    process.exit(1);
  }
})();
