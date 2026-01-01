// --- Configuration ---
const SUPABASE_URL = "https://vprtarhfpjcgshciadca.supabase.co";
const SUPABASE_KEY = "sb_publishable__s23ahvDwKLlv78MF-xBDA_MyI02PYq";
const LIFF_ID = "2008806162-K39SJq6X";

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Utility: Get URL Parameter
function getQueryParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
}

// 1. Initialize App
async function initApp() {
    const shopId = getQueryParam("shop_id");

    // Validate Shop ID
    if (!shopId) {
        showError("ไม่พบร้านค้า (Require shop_id)");
        return;
    }

    try {
        // Fetch Shop Details
        const { data: shop, error } = await supabaseClient
            .from("shops")
            .select("*")
            .eq("id", shopId)
            .single();

        if (error || !shop) {
            console.error(error);
            showError("ไม่พบร้านค้านี้ในระบบ");
            return;
        }

        // Setup UI
        renderShopUI(shop);
        document.getElementById("shopId").value = shop.id;

        // Init LIFF
        await initLiff();

        // Show App, Hide Loading
        document.getElementById("loadingView").style.display = "none";
        document.getElementById("appContainer").style.display = "block";

    } catch (err) {
        console.error("Init Error", err);
        showError("เกิดข้อผิดพลาดในการโหลดข้อมูล");
    }
}

// 2. Render Dynamic UI based on Business Type
function renderShopUI(shop) {
    document.getElementById("shopName").innerText = shop.name;

    const iconEl = document.getElementById("shopIcon");
    const dynamicDiv = document.getElementById("dynamicFields");
    let html = "";

    // -- Logic: Switch form fields based on type --
    if (shop.business_type === 'carwash') {
        iconEl.className = "fas fa-car-wash fa-3x";
        html = `
            <div class="form-group">
                <label><i class="fas fa-car-side"></i> ยี่ห้อ / รุ่นรถ</label>
                <input type="text" id="detail1" placeholder="เช่น Honda Civic" required />
            </div>
            <div class="form-group">
                <label><i class="fas fa-id-card"></i> เลขทะเบียน</label>
                <input type="text" id="detail2" placeholder="เช่น กก-1234" required />
            </div>
             <div class="form-group">
                <label><i class="fas fa-spray-can"></i> บริการที่ต้องการ</label>
                <select id="serviceType" required>
                    <option value="ล้างสี ดูดฝุ่น">ล้างสี ดูดฝุ่น</option>
                    <option value="เคลือบสี">เคลือบสี</option>
                    <option value="ซักเบาะ">ซักเบาะ</option>
                </select>
            </div>
        `;
    } else if (shop.business_type === 'clinic') {
        iconEl.className = "fas fa-user-md fa-3x";
        document.getElementById("shopDesc").innerText = "จองคิวตรวจรักษา";
        html = `
            <div class="form-group">
                <label><i class="fas fa-stethoscope"></i> อาการเบื้องต้น / สาเหตุที่นัด</label>
                <input type="text" id="detail1" placeholder="เช่น ปวดหัว, ทำแผล, ตรวจสุขภาพ" required />
            </div>
            <div class="form-group">
                <label><i class="fas fa-user-nurse"></i> แผนก / แพทย์ (ถ้ามี)</label>
                <input type="text" id="detail2" placeholder="ระบุหรือไม่ก็ได้" />
            </div>
             <input type="hidden" id="serviceType" value="ตรวจรักษา" />
        `;
    } else if (shop.business_type === 'salon') {
        iconEl.className = "fas fa-cut fa-3x";
        document.getElementById("shopDesc").innerText = "จองคิวเสริมสวย";
        html = `
            <div class="form-group">
                <label><i class="fas fa-cut"></i> บริการที่ต้องการ</label>
                 <select id="serviceType" required>
                    <option value="ตัดผม">ตัดผม</option>
                    <option value="ทำสี">ทำสี</option>
                    <option value="ดัด/ยืด">ดัด/ยืด</option>
                    <option value="สระไดร์">สระไดร์</option>
                </select>
            </div>
            <div class="form-group">
                <label><i class="fas fa-users"></i> ช่างที่ต้องการ (ถ้ามี)</label>
                <input type="text" id="detail1" placeholder="ระบุชื่อช่าง หรือ ไม่ระบุ" />
            </div>
             <input type="hidden" id="detail2" value="" />
        `;
    }

    dynamicDiv.innerHTML = html;
}

function showError(msg) {
    document.getElementById("loadingView").innerHTML = `
        <br><br>
        <i class="fas fa-exclamation-circle fa-3x" style="color:#e74c3c;"></i>
        <h3 style="color:#e74c3c;">${msg}</h3>
    `;
}

// 3. LIFF Initialization
async function initLiff() {
    try {
        await liff.init({ liffId: LIFF_ID });
        if (!liff.isLoggedIn()) {
            liff.login();
        } else {
            const profile = await liff.getProfile();
            document.getElementById("userId").value = profile.userId;
            document.getElementById("displayName").value = profile.displayName;
        }
    } catch (err) {
        console.warn("LIFF Error (Running in Browser?):", err);
    }
}

// 4. Handle Submit
document.getElementById("bookingForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = document.getElementById("submitBtn");
    btn.disabled = true;
    btn.innerText = "กำลังจอง...";

    // Collect Data
    const shopId = document.getElementById("shopId").value;
    const name = document.getElementById("name").value;
    const phone = document.getElementById("phone").value;
    const date = document.getElementById("date").value;
    const time = document.getElementById("time").value;
    const userId = document.getElementById("userId").value;

    // Dynamic Data
    const detail1 = document.getElementById("detail1") ? document.getElementById("detail1").value : "";
    const detail2 = document.getElementById("detail2") ? document.getElementById("detail2").value : "";

    let serviceType = "";
    if (document.getElementById("serviceType")) {
        serviceType = document.getElementById("serviceType").value;
    }

    // Construct JSON Details based on context
    // Ideally we should know the type here, but sticking to generic storage is easier
    const detailsObj = {
        detail1: detail1,
        detail2: detail2
    };

    const bookingData = {
        shop_id: shopId,
        user_id: userId,
        name: name,
        phone: phone,
        date: date,
        time: time,
        service_type: serviceType,
        details: detailsObj,
        status: 'pending'
    };

    console.log("Submitting:", bookingData);

    const { error } = await supabaseClient.from("bookings").insert([bookingData]);

    if (error) {
        alert("เกิดข้อผิดพลาด: " + error.message);
        btn.disabled = false;
        btn.innerText = "ยืนยันการจอง";
    } else {
        alert("✅ จองสำเร็จ! \nเราจะส่งการแจ้งเตือนให้ทราบผ่าน LINE ครับ");
        if (liff.isInClient()) liff.closeWindow();
        else location.reload();
    }
});

// Start
initApp();
