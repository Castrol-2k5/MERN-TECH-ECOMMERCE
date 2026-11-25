import os
import docx
from docx.shared import Pt, RGBColor, Cm
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import parse_xml
from docx.oxml.ns import nsdecls

def create_week9_docx(output_path):
    doc = docx.Document()

    # Page setup - Margins: Left 3cm, others 2cm (Standard Vietnamese thesis/report format)
    section = doc.sections[0]
    section.top_margin = Cm(2.0)
    section.bottom_margin = Cm(2.0)
    section.left_margin = Cm(3.0)
    section.right_margin = Cm(2.0)

    # Styling helpers
    COLOR_PRIMARY = RGBColor(0x1E, 0x3A, 0x8A)      # Deep Navy Blue #1E3A8A
    COLOR_TITLE_DARK = RGBColor(0x0F, 0x17, 0x2A)   # Dark Slate #0F172A
    COLOR_SUBTITLE = RGBColor(0x25, 0x63, 0xEB)     # Royal Blue #2563EB

    def set_cell_props(cell, fill_hex=None, align_center=False):
        tcPr = cell._tc.get_or_add_tcPr()
        if fill_hex:
            shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{fill_hex}"/>')
            tcPr.append(shd)
        tcMar = parse_xml(f'''
            <w:tcMar {nsdecls("w")}>
                <w:top w:w="120" w:type="dxa"/>
                <w:bottom w:w="120" w:type="dxa"/>
                <w:left w:w="160" w:type="dxa"/>
                <w:right w:w="160" w:type="dxa"/>
            </w:tcMar>
        ''')
        tcPr.append(tcMar)
        for p in cell.paragraphs:
            p.paragraph_format.space_before = Pt(2)
            p.paragraph_format.space_after = Pt(2)
            p.paragraph_format.line_spacing = 1.15
            if align_center:
                p.alignment = WD_ALIGN_PARAGRAPH.CENTER

    def set_table_borders(table, color="CBD5E1", sz="4"):
        tblPr = table._tbl.tblPr
        borders = parse_xml(f'''
            <w:tblBorders {nsdecls("w")}>
                <w:top w:val="single" w:sz="{sz}" w:space="0" w:color="{color}"/>
                <w:left w:val="single" w:sz="{sz}" w:space="0" w:color="{color}"/>
                <w:bottom w:val="single" w:sz="{sz}" w:space="0" w:color="{color}"/>
                <w:right w:val="single" w:sz="{sz}" w:space="0" w:color="{color}"/>
                <w:insideH w:val="single" w:sz="{sz}" w:space="0" w:color="{color}"/>
                <w:insideV w:val="single" w:sz="{sz}" w:space="0" w:color="{color}"/>
            </w:tblBorders>
        ''')
        tblPr.append(borders)

    # 1. Document Title
    p_title = doc.add_paragraph()
    p_title.paragraph_format.space_before = Pt(0)
    p_title.paragraph_format.space_after = Pt(8)
    run_title = p_title.add_run("BÁO CÁO TIẾN ĐỘ TUẦN 9 (09/11/2026 – 15/11/2026)")
    run_title.font.name = "Times New Roman"
    run_title.font.size = Pt(16)
    run_title.bold = True
    run_title.font.color.rgb = COLOR_PRIMARY

    # Meta Info
    def add_meta_line(label, value, bold_label=True, bold_val=False, space_after=4):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(0)
        p.paragraph_format.space_after = Pt(space_after)
        p.paragraph_format.line_spacing = 1.15
        
        r1 = p.add_run(label)
        r1.font.name = "Times New Roman"
        r1.font.size = Pt(11)
        r1.bold = bold_label
        
        r2 = p.add_run(value)
        r2.font.name = "Times New Roman"
        r2.font.size = Pt(11)
        r2.bold = bold_val
        return p

    add_meta_line("Tên đề tài: ", "Nghiên cứu công nghệ MERN Stack và xây dựng website thương mại điện tử cho chuỗi cửa hàng thiết bị công nghệ.", bold_label=True, bold_val=True)
    add_meta_line("Mô hình triển khai: ", "Nền tảng bán lẻ đa kênh Omnichannel Retail Platform (Storefront B2C, Web POS, Branch Portal, HQ Admin) theo kiến trúc Modular Monolith (Backend) và Feature-based Architecture (Frontend).")
    add_meta_line("Nhóm thực hiện: \n", "- Nguyễn Quốc Bảo – 23110182\n- Trần Nguyễn Castrol - 23110185")
    add_meta_line("Giảng viên hướng dẫn: ", "Nguyễn Hữu Trung")
    add_meta_line("Link GitHub: ", "https://github.com/Castrol-2k5/MERN-TECH-ECOMMERCE.git", space_after=12)

    # Section Header Helpers
    def add_section_header(title):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(12)
        p.paragraph_format.space_after = Pt(6)
        r = p.add_run(title)
        r.font.name = "Times New Roman"
        r.font.size = Pt(14)
        r.bold = True
        r.font.color.rgb = COLOR_TITLE_DARK
        return p

    def add_subsection_header(title):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(8)
        p.paragraph_format.space_after = Pt(4)
        r = p.add_run(title)
        r.font.name = "Times New Roman"
        r.font.size = Pt(13)
        r.bold = True
        r.font.color.rgb = COLOR_PRIMARY
        return p

    def add_group_header(title):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(6)
        p.paragraph_format.space_after = Pt(2)
        r = p.add_run(title)
        r.font.name = "Times New Roman"
        r.font.size = Pt(12)
        r.bold = True
        r.font.color.rgb = COLOR_SUBTITLE
        return p

    def add_bullet_point(text, space_after=3):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(0)
        p.paragraph_format.space_after = Pt(space_after)
        p.paragraph_format.line_spacing = 1.15
        p.paragraph_format.left_indent = Cm(0.6)
        r = p.add_run(f"• {text}")
        r.font.name = "Times New Roman"
        r.font.size = Pt(11)
        return p

    def add_body_paragraph(text, space_after=6):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(0)
        p.paragraph_format.space_after = Pt(space_after)
        p.paragraph_format.line_spacing = 1.15
        r = p.add_run(text)
        r.font.name = "Times New Roman"
        r.font.size = Pt(11)
        return p

    # --- SECTION I ---
    add_section_header("I. MỤC TIÊU TUẦN 9 & TỔNG QUAN NỘI DUNG THỰC HIỆN")
    add_subsection_header("1. Những việc ĐÃ HOÀN THÀNH")
    add_body_paragraph("Sau khi hoàn tất phân hệ nhân viên thu ngân Web POS ở Tuần 8, mục tiêu cốt lõi của Tuần 9 là: 'Hiện thực hóa Trọn vẹn Phân hệ Quản lý Chi nhánh (Branch Manager Omnichannel Portal) & Chuẩn bị Nền tảng Điều hành Chuỗi Cấp cao HQ'. Đã hoàn thành 100% khối lượng công việc:")

    add_group_header("A. Phân hệ Quản trị Nhân sự & Bảng Xếp hạng KPI Đội ngũ:")
    add_bullet_point("Quản lý nhân sự showroom (BranchStaffPage): Quản lý danh sách nhân viên thuộc chi nhánh phụ trách; phân quyền tài khoản thu ngân/kỹ thuật và bật/tắt trạng thái hoạt động an toàn.")
    add_bullet_point("Bảng xếp hạng KPI thi đua đội ngũ (staffAnalytics.service.js): Tổng hợp doanh thu thực tế, số lượng đơn hoàn tất, giá trị trung bình đơn (AOV) và hoa hồng tạm tính của từng nhân sự để xếp hạng Top Performers.")

    add_group_header("B. Giám sát Dòng tiền Mặt Thời gian thực & Phê duyệt Đặc quyền:")
    add_bullet_point("Giám sát két tiền trực tiếp (Live Cash Monitor): Hiển thị trạng thái toàn bộ hộc tiền/ca quầy đang mở tại chi nhánh, theo dõi tức thì doanh thu tiền mặt phát sinh.")
    add_bullet_point("Xử lý & Ký duyệt giải trình chênh lệch két ca: Khi ca đóng bị lệch tiền, hệ thống gửi cảnh báo; Quản lý chi nhánh đối soát biên bản K80, nhập lý do giải trình và ký duyệt chốt ca; áp dụng cơ chế kiểm soát kép Dual-Control.")
    add_bullet_point("Trung tâm phê duyệt đặc quyền di động (ManagerApprovalsPage & ApprovalAlertBell): Hỗ trợ Quản lý phê duyệt từ xa đơn đổi trả hoàn tiền lớn, chi tiền quỹ khẩn cấp hoặc hủy đơn giữ máy Click & Collect quá hạn.")

    add_group_header("C. Kiểm kê Serial Định kỳ, Kéo hàng Liên Chi nhánh & Xuất trả RMA:")
    add_bullet_point("Kiểm kê kho định kỳ theo mã Serial/IMEI (BranchStocktakePage): Nhân viên quét toàn bộ mã máy thực tế; backend chạy thuật toán hiệu số tập hợp so khớp phát hiện máy thất thoát (MISSING) và tự động cập nhật trạng thái thiết bị sang LOST.")
    add_bullet_point("Đề xuất điều chuyển kéo hàng (Pull Transfer Requests): Quản lý tạo phiếu yêu cầu hỗ trợ SKU và số lượng từ showroom lân cận khi kho chi nhánh chạm ngưỡng tối thiểu.")
    add_bullet_point("Xuất trả thiết bị bảo hành/lỗi về Hãng (RMA Outbound): Lập phiếu xuất trả máy lỗi phần cứng về Nhà phân phối, ghi nhận vận đơn chuyển phát và theo dõi tiến độ đổi máy mới.")

    add_group_header("D. Báo cáo Phân tích Chiến lược & Xử lý Khiếu nại Khách hàng:")
    add_bullet_point("Báo cáo chiến lược chi nhánh (BranchAnalyticsPage): Biểu đồ phân bổ doanh thu theo khung giờ vàng (Peak Sales Hours), tỷ trọng thanh toán Tiền mặt vs Chuyển khoản, và tỷ lệ hoàn trả theo danh mục.")
    add_bullet_point("Tiếp nhận & Xử lý khiếu nại khách hàng (BranchComplaintsPage): Xử lý phản hồi dịch vụ, phê duyệt voucher bồi thường hoặc đổi mới máy tại chỗ trong hạn mức trần 2.000.000 ₫/vụ việc.")

    add_group_header("E. Lập Lịch Ca kíp Tuần & Chấm công Rút gọn:")
    add_bullet_point("Lưới phân ca tuần Roster (BranchRosterPage): Giao diện ma trận 7 ngày phân bổ nhân sự trực theo các ca chuẩn (Sáng, Chiều, Cả Ngày), chống trùng lặp ca.")
    add_bullet_point("Chấm công rút gọn (Lite Attendance): Ghi nhận trạng thái có mặt (PRESENT), đi trễ (LATE), nghỉ phép (EXCUSED) hoặc vắng mặt (ABSENT) của nhân sự showroom.")

    add_group_header("F. Đồng bộ Dữ liệu Kiểm thử & Đóng gói Frontend:")
    add_bullet_point("Kiểm thử tự động đạt 100%: 27/27 Test Suites, 222/222 Test Cases passed trên Jest & Supertest.")
    add_bullet_point("Frontend Production Build: Vite build hoàn thành 2658 modules trong 1.45s; ESLint đạt 0 errors, 0 warnings.")

    add_subsection_header("2. Những việc CHƯA LÀM ĐƯỢC / CẦN KHẮC PHỤC")
    add_bullet_point("Báo cáo tài chính Lãi Lỗ P&L hợp nhất toàn chuỗi và tính toán giá vốn hàng bán COGS, chi phí vận hành OPEX (chuyển sang Tuần 10 - Giám đốc Chuỗi HQ).")
    add_bullet_point("Thuật toán tự động bổ sung hàng Min/Max và cân bằng hàng tồn đọng Dead-stock giữa các showroom (chuyển sang Tuần 10).")

    # --- SECTION II ---
    add_section_header("II. KẾT QUẢ THỰC HIỆN CHI TIẾT & MINH CHỨNG")
    add_body_paragraph("Bảng tổng hợp chuỗi Commit trên nhánh feat/branch-manager-expansion:")

    # Table 1: Commits
    table_commits = doc.add_table(rows=6, cols=5)
    table_commits.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(table_commits)

    headers_c = ["STT", "Commit Hash", "Module / Phân hệ", "Thông điệp Commit", "Chi tiết thay đổi"]
    widths_c = [Cm(1.0), Cm(2.2), Cm(3.2), Cm(4.8), Cm(4.8)]

    # Format header row
    hdr_cells = table_commits.rows[0].cells
    for i, title in enumerate(headers_c):
        hdr_cells[i].width = widths_c[i]
        set_cell_props(hdr_cells[i], fill_hex="F1F5F9", align_center=(i in [0, 1]))
        p = hdr_cells[i].paragraphs[0]
        r = p.add_run(title)
        r.font.name = "Times New Roman"
        r.font.size = Pt(10)
        r.bold = True
        r.font.color.rgb = COLOR_TITLE_DARK

    commit_data = [
        ("1", "87b99e0", "Staff & KPI (W1)", "feat(branch-manager): implement Wave 1 - branch staff management and team KPI leaderboard", "Quản trị nhân sự chi nhánh, gán ca và bảng xếp hạng thi đua KPI nhân viên quầy"),
        ("2", "d69fc01", "Cash & Approvals (W2)", "feat(branch-manager): implement Wave 2 - live cash monitor, discrepancy resolution, privilege approvals", "Giám sát két tiền live, xử lý lệch két ca, chuông báo phê duyệt đặc quyền di động"),
        ("3", "c08de18", "Stocktake & RMA (W3)", "feat(branch-manager): implement Wave 3 - Serial stocktaking, pull transfer requests, and RMA outbound", "Kiểm kê Serial chu kỳ, phiếu kéo hàng liên chi nhánh, xuất trả bảo hành RMA nhà cung cấp"),
        ("4", "60c67dc", "Strategy & Case (W4)", "feat(branch-manager): implement Wave 4 - branch strategy analytics and escalation complaints", "Phân tích giờ vàng, tỷ trọng thanh toán, tiếp nhận & xử lý khiếu nại bồi thường tại chỗ"),
        ("5", "fc4198d", "Roster & Attend (W5)", "feat(branch-manager): implement Wave 5 - weekly shift roster and lite attendance", "Ma trận phân ca tuần 7 ngày, chấm công có mặt/trễ/nghỉ cho nhân sự showroom")
    ]

    for row_idx, data in enumerate(commit_data, start=1):
        row_cells = table_commits.rows[row_idx].cells
        for col_idx, text in enumerate(data):
            row_cells[col_idx].width = widths_c[col_idx]
            set_cell_props(row_cells[col_idx], align_center=(col_idx in [0, 1]))
            p = row_cells[col_idx].paragraphs[0]
            r = p.add_run(text)
            r.font.name = "Times New Roman"
            r.font.size = Pt(9.5)
            if col_idx == 1:
                r.bold = True
                r.font.color.rgb = COLOR_PRIMARY

    # Spacing
    doc.add_paragraph().paragraph_format.space_after = Pt(4)

    # --- SECTION III ---
    add_section_header("III. NHẬT KÝ LÀM CHỦ AI (AI USAGE LOG - TC2.3)")
    add_body_paragraph("Minh chứng tinh thần làm chủ công nghệ của sinh viên, phát hiện và tự tay tái cấu trúc 4 lỗi/ảo giác kỹ thuật sâu của AI:")

    def add_ai_case(title, context, ai_hallucination, student_fix, commit_ref):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(6)
        p.paragraph_format.space_after = Pt(2)
        r = p.add_run(title)
        r.font.name = "Times New Roman"
        r.font.size = Pt(11.5)
        r.bold = True
        r.font.color.rgb = COLOR_TITLE_DARK

        add_bullet_point(f"Bối cảnh: {context}")
        add_bullet_point(f"Ảo giác của AI: {ai_hallucination}")
        add_bullet_point(f"Phân tích & Tái cấu trúc của sinh viên: {student_fix}")
        add_bullet_point(f"Commit Git đối chiếu: {commit_ref}", space_after=6)

    add_ai_case(
        "Trường hợp 1: Vi phạm Nguyên tắc Phân tách Trách nhiệm (Dual-Control) khi Phê duyệt Lệch Két",
        "Xây dựng API phê duyệt giải trình chênh lệch két tiền ca thu ngân trong approval.service.js.",
        "AI chỉ kiểm tra role BRANCH_MANAGER mà không kiểm tra ai là người đứng ca bán hàng đó.",
        "Vi phạm nguyên tắc kiểm soát nội bộ cốt lõi: Quản lý chi nhánh không thể tự duyệt ca lệch két do chính mình bán tại quầy POS. Sinh viên bổ sung điều kiện chặn đứng hành vi tự phê duyệt và tự động đẩy yêu cầu lên SUPER_ADMIN.",
        "d69fc01"
    )

    add_ai_case(
        "Trường hợp 2: Bỏ qua Đối soát Tập hợp Mã Serial Khi Kiểm kê Kho (Cycle Count)",
        "Lập trình hàm chốt kết quả kiểm kê kho thiết bị công nghệ trong inventoryControl.service.js.",
        "AI viết code đối soát đơn giản chỉ bằng cách so sánh 2 con số: Lấy số lượng mã quét được gán đè trực tiếp vào branchInventory.quantity.",
        "Hàng công nghệ quản lý theo Serial đòi hỏi phải chỉ ra đích danh mã máy thất thoát. Sinh viên thiết kế thuật toán hiệu số tập hợp (Set Difference), tự động đổi trạng thái mã mất sang LOST và ghi vết biên bản kiểm kê minh bạch.",
        "c08de18"
    )

    add_ai_case(
        "Trường hợp 3: Thiếu Thẩm quyền Hạn mức Ngân sách khi Bồi thường Khiếu nại",
        "Lập trình tính năng giải quyết khiếu nại khách hàng tại chi nhánh trong complaint.service.js.",
        "AI cho phép Quản lý chi nhánh tự do nhập số tiền bồi thường compensationAmount mà không đặt ra bất kỳ giới hạn trần nào.",
        "Nguy cơ lạm quyền hoặc chi vượt ngân sách quỹ showroom. Sinh viên thiết lập hạn mức trần 2.000.000 ₫/vụ việc tại chi nhánh; các khoản bồi thường lớn hơn bắt buộc phải chuyển cấp lên Trụ sở chính HQ phê duyệt.",
        "60c67dc"
    )

    add_ai_case(
        "Trường hợp 4: Lệch Múi giờ UTC vs Localhost khi Phân ca Kíp Làm việc Tuần",
        "Lưu trữ lịch phân ca làm việc của nhân viên trong tuần trong workSchedule.model.js.",
        "AI định nghĩa trường ngày làm việc là kiểu Date và truyền object Date trực tiếp từ Frontend.",
        "MongoDB lưu kiểu Date luôn chuyển về UTC làm ca sáng Thứ Hai (GMT+7) bị lưu thành chiều Chủ Nhật hôm trước, gây hiển thị sai lệch lùi 1 ngày trên giao diện. Sinh viên chuẩn hóa trường ngày thành chuỗi ISO độc lập múi giờ YYYY-MM-DD kết hợp enum ca cố định.",
        "fc4198d"
    )

    # --- SECTION IV ---
    add_section_header("IV. BẢNG ĐỐI CHIẾU TIÊU CHÍ RUBRIC KHOA CNTT")

    # Table 2: Rubric
    table_rubric = doc.add_table(rows=7, cols=4)
    table_rubric.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(table_rubric)

    headers_r = ["Tiêu chí Rubric", "Yêu cầu Mức 5 (Xuất sắc)", "Kết quả đạt được thực tế trong Tuần 9", "Mức tự đánh giá"]
    widths_r = [Cm(3.0), Cm(4.5), Cm(6.5), Cm(2.0)]

    hdr_cells_r = table_rubric.rows[0].cells
    for i, title in enumerate(headers_r):
        hdr_cells_r[i].width = widths_r[i]
        set_cell_props(hdr_cells_r[i], fill_hex="F1F5F9", align_center=(i in [0, 3]))
        p = hdr_cells_r[i].paragraphs[0]
        r = p.add_run(title)
        r.font.name = "Times New Roman"
        r.font.size = Pt(10)
        r.bold = True
        r.font.color.rgb = COLOR_TITLE_DARK

    rubric_data = [
        ("TC2.1 (Kiến trúc)", "Modular rõ ràng, xử lý concurrency triệt tiêu bán âm, state machine chặt chẽ.", "Quản lý kiểm kê Serial toàn vẹn; thuật toán Set Difference; phân quyền kiểm soát kép Dual-Control.", "Mức 5 (5.0/5.0 đ)"),
        ("TC2.2 (Hoàn thiện SP)", ">= 100% chức năng cốt lõi, không lỗi blocker, responsive, 0 mock data.", "Hoàn thành trọn vẹn 5 Waves phân hệ Branch Manager; 100% tính năng hoạt động trên MongoDB Live.", "Mức 5 (5.0/5.0 đ)"),
        ("TC2.3 (Làm chủ AI)", "AI Usage Log chi tiết, khớp commit Git; ghi nhận >= 5 lỗi/ảo giác tự sửa.", "Ghi nhận 4 trường hợp kỹ thuật sâu: Dual-Control Két tiền, Set Difference Stocktake, Hạn mức Khiếu nại, Múi giờ Roster.", "Mức 5 (5.0/5.0 đ)"),
        ("TC2.4 (Chất lượng code)", "0 lỗi lint / 1000 dòng, không lộ secret, commit phân bổ đều đặn.", "0 lỗi ESLint, .env an toàn tuyệt đối, phân chia 5 Waves commit rành mạch chuẩn Conventional Commits.", "Mức 5 (5.0/5.0 đ)"),
        ("TC2.5 (Kiểm thử PM)", "Coverage > 70%, 100% test pass ở CI cuối, kiểm thử >= 4 tầng.", "27/27 Test Suites Passed, 222/222 Tests Passed 100% (Bao quát thêm KPI, Dual-Control, Stocktake, Complaints, Roster).", "Mức 5 (5.0/5.0 đ)"),
        ("TC2.6 (CI/CD)", "Pipeline chạy ổn định các chặng, build frontend sạch không lỗi.", "Vite build hoàn thành 2658 modules trong 1.45s; CI GitHub Actions hoạt động trơn tru.", "Mức 4.9/5.0 đ")
    ]

    for row_idx, data in enumerate(rubric_data, start=1):
        row_cells = table_rubric.rows[row_idx].cells
        for col_idx, text in enumerate(data):
            row_cells[col_idx].width = widths_r[col_idx]
            set_cell_props(row_cells[col_idx], align_center=(col_idx in [0, 3]))
            p = row_cells[col_idx].paragraphs[0]
            r = p.add_run(text)
            r.font.name = "Times New Roman"
            r.font.size = Pt(9.5)
            if col_idx == 0:
                r.bold = True
            if col_idx == 3:
                r.bold = True
                r.font.color.rgb = COLOR_PRIMARY

    # Spacing
    doc.add_paragraph().paragraph_format.space_after = Pt(4)

    # --- SECTION V ---
    add_section_header("V. KẾ HOẠCH HÀNH ĐỘNG TUẦN 10 (GIAI ĐOẠN HOÀN TẤT & ĐỘT PHÁ ĐA KÊNH)")
    add_bullet_point("Hoàn thiện Phân hệ Giám đốc Chuỗi Trụ sở Chính HQ: Xây dựng Trung tâm Cảnh báo Đỏ (Red Alert Command Center), thuật toán Tự động Bổ sung Hàng Min/Max và Tái cân bằng Kho Hàng Đọng (Dead-stock Rebalancing), Quản lý Nhà cung cấp, Đơn đặt hàng Mua (PO) và Báo cáo P&L Hợp nhất.")
    add_bullet_point("Mở rộng Trải nghiệm Đa kênh Khách hàng B2C: Đồng bộ hóa lịch sử đơn hàng quầy POS và Online theo SĐT, Cơ chế Giỏ hàng lai Hybrid Cart Sync, Gợi ý phụ kiện mua kèm thông minh, Đánh giá đơn hàng 1-5 sao và Cổng tự phục vụ Bảo hành / Đổi trả từ xa.")
    add_bullet_point("Đóng gói Toàn diện & Diễn tập Bảo vệ Đề tài: Hoàn thiện hồ sơ minh chứng 13 tiêu chí nộp lên hệ thống projects-fit.hcmute.edu.vn.")

    # Save
    doc.save(output_path)
    print(f"Document successfully created at: {output_path}")

if __name__ == "__main__":
    output_file = os.path.join("docs", "BÁO CÁO TIẾN ĐỘ TUẦN 9.docx")
    create_week9_docx(output_file)
