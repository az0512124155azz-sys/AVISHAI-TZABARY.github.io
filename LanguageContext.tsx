import { createContext, useContext, useState, ReactNode } from "react";

type Lang = "he" | "en";

type Translations = Record<string, Record<Lang, string>>;

const t: Translations = {
  // Nav
  "nav.home": { he: "בית", en: "Home" },
  "nav.catalog": { he: "קטלוג", en: "Catalog" },
  "nav.order": { he: "הזמנה", en: "Order" },
  "nav.about": { he: "אודות", en: "About" },

  // Hero
  "hero.badge": { he: "הדפסות תלת מימד מקצועיות", en: "Professional 3D Printing" },
  "hero.subtitle": { he: "הפכו את הדמיון למציאות עם הדפסות תלת מימד איכותיות.\nמוצרים מותאמים אישית, ימי הולדת מיוחדים ותיקון משחקים.", en: "Turn imagination into reality with quality 3D prints.\nCustom products, special birthdays, and game repairs." },
  "hero.catalog_btn": { he: "צפו בקטלוג", en: "View Catalog" },
  "hero.order_btn": { he: "הזמינו עכשיו", en: "Order Now" },

  // Catalog
  "catalog.title": { he: "הקטלוג שלנו", en: "Our Catalog" },
  "catalog.subtitle": { he: "בחרו מהמבחר הרחב של מוצרי הדפסת תלת מימד", en: "Choose from our wide selection of 3D printed products" },
  "catalog.empty": { he: "הקטלוג ריק כרגע. מוצרים יתווספו בקרוב!", en: "Catalog is empty. Products coming soon!" },
  "catalog.out_of_stock": { he: "אזל מהמלאי", en: "Out of Stock" },
  "catalog.discount": { he: "הנחה", en: "OFF" },

  // Order
  "order.title": { he: "שלחו הזמנה", en: "Place an Order" },
  "order.subtitle": { he: "בחרו את סוג ההזמנה ומלאו את הפרטים", en: "Choose order type and fill in the details" },
  "order.name": { he: "שם מלא *", en: "Full Name *" },
  "order.name_placeholder": { he: "הכניסו שם", en: "Enter your name" },
  "order.phone": { he: "מספר טלפון *", en: "Phone Number *" },
  "order.phone_placeholder": { he: "050-1234567", en: "050-1234567" },
  "order.type": { he: "סוג הזמנה *", en: "Order Type *" },
  "order.color": { he: "בחרו צבע", en: "Choose Color" },
  "order.color_selected": { he: "צבע נבחר:", en: "Selected color:" },
  "order.products": { he: "בחרו מוצרים", en: "Choose Products" },
  "order.no_products": { he: "אין מוצרים זמינים כרגע", en: "No products available" },
  "order.cart": { he: "סל ההזמנה", en: "Order Cart" },
  "order.upload_file": { he: "העלאת קובץ (STL, OBJ, 3MF וכו׳)", en: "Upload File (STL, OBJ, 3MF etc.)" },
  "order.click_upload": { he: "לחצו להעלאת קובץ", en: "Click to upload file" },
  "order.uploading": { he: "מעלה...", en: "Uploading..." },
  "order.file_formats": { he: "STL, OBJ, 3MF, STEP, FBX, GCODE", en: "STL, OBJ, 3MF, STEP, FBX, GCODE" },
  "order.upload_photo": { he: "העלאת תמונה לתיקון", en: "Upload Repair Photo" },
  "order.photo_formats": { he: "JPG, PNG, WEBP", en: "JPG, PNG, WEBP" },
  "order.photo_uploaded": { he: "התמונה הועלתה בהצלחה", en: "Photo uploaded successfully" },
  "order.participants": { he: "כמות משתתפים", en: "Number of Participants" },
  "order.birthday_desc": { he: "אירוע יום הולדת כולל הדפסת תלת מימד חווייתית לכל המשתתפים!", en: "Birthday event includes an interactive 3D printing experience for all participants!" },
  "order.birthday_catalog": { he: "מהקטלוג", en: "From Catalog" },
  "order.birthday_custom": { he: "בהתאמה אישית", en: "Custom" },
  "order.birthday_type": { he: "סוג יום הולדת", en: "Birthday Type" },
  "order.birthday_custom_desc": { he: "ספרו לנו מה תרצו להדפיס באירוע בשדה ההערות למטה", en: "Tell us what you'd like to print at the event in the notes field below" },
  "order.repair_desc": { he: "ספרו לנו על המוצר/משחק שצריך תיקון בשדה ההערות למטה. נשמח לעזור!", en: "Tell us about the product/game that needs repair in the notes field below." },
  "order.notes": { he: "הערות נוספות", en: "Additional Notes" },
  "order.notes_placeholder": { he: "כתבו הערות, בקשות מיוחדות, פרטים על תיקון...", en: "Write notes, special requests, repair details..." },
  "order.submit": { he: "שלחו הזמנה בוואטסאפ", en: "Send Order via WhatsApp" },
  "order.added": { he: "נוסף להזמנה", en: "Added to order" },
  "order.fill_required": { he: "נא למלא שם וטלפון", en: "Please fill in name and phone" },
  "order.select_type": { he: "נא לבחור סוג הזמנה", en: "Please select order type" },
  "order.add_products": { he: "נא להוסיף מוצרים להזמנה", en: "Please add products to order" },
  "order.select_color_first": { he: "נא לבחור צבע לפני הוספת מוצר", en: "Please select a color before adding a product" },
  "order.per_participant": { he: "לכל משתתף", en: "per participant" },
  "order.sent": { he: "ההזמנה נשלחה לוואטסאפ!", en: "Order sent to WhatsApp!" },
  "order.summary": { he: "סיכום הזמנה", en: "Order Summary" },
  "order.estimated_total": { he: "מחיר סופי", en: "Final Price" },
  "order.date_label": { he: "תאריך", en: "Date" },
  "order.file_uploaded": { he: "הקובץ הועלה בהצלחה", en: "File uploaded successfully" },
  "order.file_error": { he: "שגיאה בהעלאת הקובץ", en: "Error uploading file" },
  "order.save_failed": { he: "שמירת ההזמנה נכשלה", en: "Failed to save order" },
  "order.pickup_notice": { he: "אין משלוחים – איסוף עצמי בלבד (גני תקווה)", en: "No deliveries – pickup only (Ganei Tikva)" },
  "order.choose_colors": { he: "בחרו צבעים", en: "Choose colors" },
  "order.birthday_upload": { he: "העלאת תמונה או קובץ", en: "Upload image or file" },
  "order.birthday_upload_formats": { he: "STL, OBJ, 3MF, JPG, PNG", en: "STL, OBJ, 3MF, JPG, PNG" },
  "order.birthday_discount_note": { he: "5% הנחה על הזמנות יום הולדת!", en: "5% discount on birthday orders!" },

  // Order type descriptions
  "type.catalog": { he: "הזמנה מהקטלוג", en: "Catalog Order" },
  "type.catalog_desc": { he: "בחרו מוצרים מוכנים מהקטלוג שלנו", en: "Choose ready products from our catalog" },
  "type.custom": { he: "מודל מותאם אישית", en: "Custom Model" },
  "type.custom_desc": { he: "העלו קובץ תלת מימד ונדפיס אותו עבורכם", en: "Upload a 3D file and we'll print it for you" },
  "type.birthday": { he: "יום הולדת", en: "Birthday" },
  "type.birthday_desc": { he: "אירוע הדפסת תלת מימד חווייתי", en: "Interactive 3D printing event" },
  "type.repair": { he: "תיקון משחק/מוצר", en: "Repair" },
  "type.repair_desc": { he: "נתקן חלקים שבורים במשחקים או מוצרים", en: "We fix broken parts in games or products" },

  // About
  "about.title": { he: "אודות Magic 3D", en: "About Magic 3D" },
  "about.desc": { he: "אנחנו Magic 3D – חברת הדפסות תלת מימד מגני תקווה שמתמחה ביצירת מוצרים ייחודיים, אירועי יום הולדת חווייתיים ותיקון משחקים ופריטים שנשברו. אנחנו מאמינים שכל רעיון יכול להפוך למציאות!", en: "We are Magic 3D – a 3D printing company from Ganei Tikva specializing in creating unique products, interactive birthday events, and repairing broken games and items. We believe every idea can become reality!" },
  "about.quality": { he: "הדפסות איכותיות", en: "Quality Prints" },
  "about.quality_desc": { he: "מדפסות תלת מימד מתקדמות עם דיוק גבוה", en: "Advanced 3D printers with high precision" },
  "about.personal": { he: "שירות אישי", en: "Personal Service" },
  "about.personal_desc": { he: "כל הזמנה מקבלת יחס אישי ומותאם", en: "Every order receives personalized attention" },
  "about.fast": { he: "מהיר ואמין", en: "Fast & Reliable" },
  "about.fast_desc": { he: "זמני אספקה מהירים עם תוצאות מושלמות", en: "Quick delivery with perfect results" },
  "about.birthday": { he: "ימי הולדת", en: "Birthdays" },
  "about.birthday_desc": { he: "חוויה בלתי נשכחת לילדים ולמבוגרים", en: "Unforgettable experience for kids and adults" },

  // Footer
  "footer.rights": { he: "כל הזכויות שמורות.", en: "All rights reserved." },
  "footer.whatsapp": { he: "צרו קשר בוואטסאפ", en: "Contact us on WhatsApp" },

  // Admin
  "admin.loading": { he: "טוען...", en: "Loading..." },
  "admin.title": { he: "פאנל ניהול – Magic 3D", en: "Admin Panel – Magic 3D" },
  "admin.logout": { he: "יציאה", en: "Logout" },
  "admin.catalog_mgmt": { he: "ניהול קטלוג", en: "Catalog Management" },
  "admin.products": { he: "מוצרים", en: "products" },
  "admin.new_product": { he: "מוצר חדש", en: "New Product" },
  "admin.edit_product": { he: "עריכת מוצר", en: "Edit Product" },
  "admin.product_name": { he: "שם מוצר *", en: "Product Name *" },
  "admin.category": { he: "קטגוריה", en: "Category" },
  "admin.price": { he: "מחיר (₪)", en: "Price (₪)" },
  "admin.stock_qty": { he: "כמות במלאי", en: "Stock Quantity" },
  "admin.discount": { he: "אחוז הנחה", en: "Discount %" },
  "admin.in_stock": { he: "במלאי", en: "In Stock" },
  "admin.description": { he: "תיאור", en: "Description" },
  "admin.image": { he: "תמונת מוצר", en: "Product Image" },
  "admin.print_link": { he: "קישור הדפסה", en: "Print Link" },
  "admin.open_print_link": { he: "פתח קישור הדפסה", en: "Open Print Link" },
  "admin.upload_image": { he: "העלאת תמונה", en: "Upload Image" },
  "admin.uploading": { he: "מעלה...", en: "Uploading..." },
  "admin.colors": { he: "צבעים זמינים", en: "Available Colors" },
  "admin.save": { he: "שמור שינויים", en: "Save Changes" },
  "admin.add": { he: "הוסף מוצר", en: "Add Product" },
  "admin.no_products": { he: "אין מוצרים עדיין. לחצו \"מוצר חדש\" כדי להתחיל.", en: "No products yet. Click \"New Product\" to start." },
  "admin.no_image": { he: "אין תמונה", en: "No image" },
  "admin.available": { he: "זמין", en: "Available" },
  "admin.out_of_stock": { he: "אזל", en: "Out" },
  "admin.stock": { he: "מלאי:", en: "Stock:" },
  "admin.image_uploaded": { he: "התמונה הועלתה בהצלחה", en: "Image uploaded successfully" },
  "admin.image_error": { he: "שגיאה בהעלאת התמונה", en: "Error uploading image" },
  "admin.enter_name": { he: "נא להזין שם מוצר", en: "Please enter product name" },
  "admin.updated": { he: "המוצר עודכן", en: "Product updated" },
  "admin.added": { he: "המוצר נוסף", en: "Product added" },
  "admin.save_error": { he: "שגיאה בשמירת המוצר", en: "Error saving product" },
  "admin.delete_confirm": { he: "למחוק את המוצר?", en: "Delete product?" },
  "admin.deleted": { he: "המוצר נמחק", en: "Product deleted" },
  "admin.delete_error": { he: "שגיאה במחיקת המוצר", en: "Error deleting product" },
  "admin.color_mgmt": { he: "ניהול צבעים", en: "Color Management" },
  "admin.color_name_he": { he: "שם בעברית", en: "Hebrew Name" },
  "admin.color_name_en": { he: "שם באנגלית", en: "English Name" },
  "admin.color_hex": { he: "קוד צבע", en: "Color Code" },
  "admin.add_color": { he: "הוסף צבע", en: "Add Color" },
  "admin.color_added": { he: "הצבע נוסף", en: "Color added" },
  "admin.color_deleted": { he: "הצבע נמחק", en: "Color deleted" },
  "admin.color_error": { he: "שגיאה בניהול צבעים", en: "Error managing colors" },

  // Admin - Order Confirmations (renamed from receipts)
  "admin.confirmation_mgmt": { he: "אישורי הזמנות", en: "Order Confirmations" },
  "admin.no_orders": { he: "אין הזמנות עדיין", en: "No orders yet" },
  "admin.confirmation_discount": { he: "הנחה (%)", en: "Discount (%)" },
  "admin.apply_discount": { he: "עדכן הנחה", en: "Apply Discount" },
  "admin.send_confirmation": { he: "שלח אישור הזמנה ללקוח", en: "Send Order Confirmation to Customer" },
  "admin.confirmation_sent": { he: "אישור ההזמנה נשלח", en: "Order confirmation sent" },
  "admin.confirmation_title": { he: "אישור הזמנה", en: "Order Confirmation" },
  "admin.original_price": { he: "מחיר מקורי", en: "Original Price" },
  "admin.final_price": { he: "מחיר סופי", en: "Final Price" },
  "admin.discount_updated": { he: "ההנחה עודכנה", en: "Discount updated" },
  "admin.confirmation_note": { he: "הערת אישור", en: "Confirmation Note" },
  "admin.confirmation_note_placeholder": { he: "כתבו הערה להזמנה (לדוגמה: ההזמנה אושרה, זמן איסוף...)", en: "Write a note (e.g.: order confirmed, pickup time...)" },
  "admin.confirm_order": { he: "אשר הזמנה", en: "Confirm Order" },
  "admin.order_confirmed": { he: "ההזמנה אושרה", en: "Order confirmed" },
  "admin.confirmed": { he: "אושר", en: "Confirmed" },
  "admin.note": { he: "הערה", en: "Note" },

  // Finance tracker
  "admin.finance_mgmt": { he: "מעקב הוצאות והכנסות", en: "Finance Tracker" },
  "admin.add_expense": { he: "הוסף הוצאה", en: "Add Expense" },
  "admin.add_income": { he: "הוסף הכנסה", en: "Add Income" },
  "admin.expense": { he: "הוצאה", en: "Expense" },
  "admin.income": { he: "הכנסה", en: "Income" },
  "admin.total_income": { he: "סה״כ הכנסות", en: "Total Income" },
  "admin.total_expenses": { he: "סה״כ הוצאות", en: "Total Expenses" },
  "admin.net_profit": { he: "רווח נקי", en: "Net Profit" },
  "admin.amount": { he: "סכום (₪)", en: "Amount (₪)" },
  "admin.what_for": { he: "על מה?", en: "What for?" },
  "admin.no_transactions": { he: "אין רשומות לחודש זה", en: "No records for this month" },
  "admin.transaction_added": { he: "הרשומה נוספה", en: "Record added" },
  "admin.transaction_deleted": { he: "הרשומה נמחקה", en: "Record deleted" },
  "admin.monthly_summary": { he: "סיכום חודשי", en: "Monthly Summary" },

  // Admin login
  "login.title": { he: "פאנל ניהול", en: "Admin Panel" },
  "login.email": { he: "אימייל", en: "Email" },
  "login.password": { he: "סיסמה", en: "Password" },
  "login.submit": { he: "התחבר", en: "Login" },
  "login.loading": { he: "מתחבר...", en: "Logging in..." },
  "login.success": { he: "התחברת בהצלחה", en: "Logged in successfully" },
  "login.error": { he: "שם משתמש או סיסמה שגויים", en: "Invalid email or password" },
};

type LanguageContextType = {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string) => string;
  dir: "rtl" | "ltr";
};

const LanguageContext = createContext<LanguageContextType>({
  lang: "he",
  setLang: () => {},
  t: (key: string) => key,
  dir: "rtl",
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>("he");

  const translate = (key: string): string => {
    return t[key]?.[lang] ?? key;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t: translate, dir: lang === "he" ? "rtl" : "ltr" }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
