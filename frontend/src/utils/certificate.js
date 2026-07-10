export const downloadCertificate = (studentName, courseTitle, totalXpEarned, completedCount, date, onComplete) => {
  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Certificate - ${courseTitle}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Inter:wght@400;600&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { background: #fff; display: flex; align-items: center; justify-content: center; min-height: 100vh; font-family: 'Inter', sans-serif; }
  .cert { width: 900px; min-height: 620px; border: 12px solid #06b6d4; border-radius: 24px; padding: 60px 80px; text-align: center; position: relative; background: linear-gradient(135deg,#f0fdfa,#eff6ff); }
  .cert::before { content: ''; position: absolute; inset: 16px; border: 2px dashed #a5f3fc; border-radius: 14px; pointer-events: none; }
  .logo { font-size: 48px; margin-bottom: 8px; }
  .brand { font-size: 13px; letter-spacing: 4px; text-transform: uppercase; color: #0891b2; font-weight: 600; margin-bottom: 40px; }
  .cert-title { font-family: 'Playfair Display', serif; font-size: 42px; color: #0c4a6e; margin-bottom: 12px; }
  .sub { font-size: 16px; color: #64748b; margin-bottom: 36px; }
  .name { font-family: 'Playfair Display', serif; font-size: 52px; color: #0891b2; border-bottom: 3px solid #0891b2; display: inline-block; padding-bottom: 8px; margin-bottom: 28px; }
  .course-label { font-size: 13px; letter-spacing: 3px; text-transform: uppercase; color: #64748b; margin-bottom: 8px; }
  .course-name { font-size: 26px; font-weight: 700; color: #1e293b; margin-bottom: 40px; }
  .footer { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 30px; }
  .footer-item { text-align: center; }
  .footer-item .value { font-weight: 700; font-size: 15px; color: #1e293b; border-top: 2px solid #1e293b; padding-top: 6px; }
  .footer-item .label { font-size: 11px; color: #94a3b8; margin-top: 4px; letter-spacing: 1px; text-transform: uppercase; }
  .xp { background: linear-gradient(135deg,#f59e0b,#ef4444); color: white; font-size: 15px; font-weight: 700; padding: 8px 20px; border-radius: 999px; display: inline-block; margin-bottom: 20px; }
</style>
</head>
<body>
<div class="cert">
  <div class="logo">💻</div>
  <div class="brand">Programmer Learner</div>
  <div class="cert-title">Certificate of Completion</div>
  <div class="sub">This is to certify that</div>
  <div class="name">${studentName}</div>
  <div class="course-label">has successfully completed</div>
  <div class="course-name">${courseTitle}</div>
  ${totalXpEarned > 0 ? `<div class="xp">⚡ ${totalXpEarned} XP Earned</div>` : ''}
  <div class="footer">
    <div class="footer-item"><div class="value">${completedCount} Lessons</div><div class="label">Completed</div></div>
    <div class="footer-item"><div class="value">Programmer Learner</div><div class="label">Platform</div></div>
    <div class="footer-item"><div class="value">${date}</div><div class="label">Issue Date</div></div>
  </div>
</div>
</body></html>`
  const blob = new Blob([html], { type: 'text/html' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `Certificate_${courseTitle.replace(/\s+/g,'_')}_${studentName.replace(/\s+/g,'_')}.html`
  a.click()
  URL.revokeObjectURL(url)
  if (onComplete) {
    setTimeout(onComplete, 1000)
  }
}
