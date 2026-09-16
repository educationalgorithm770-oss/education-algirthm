<?php
// includes/feature-unlock-modal.php — Feature Lock Teaser Modal
?>
<style>
.flock-backdrop {
  position: fixed;
  inset: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(7, 9, 14, 0.85);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  z-index: 99999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.25rem;
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.3s ease, visibility 0.3s ease;
}
.flock-backdrop.active {
  opacity: 1;
  visibility: visible;
}
.flock-card {
  background: linear-gradient(145deg, #0d1322, #182238);
  border: 1px solid rgba(99, 102, 241, 0.35);
  border-radius: 20px;
  width: 100%;
  max-width: 480px;
  padding: 1.75rem 2rem;
  color: #f8fafc;
  font-family: 'Plus Jakarta Sans', -apple-system, sans-serif;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.65), 0 0 30px rgba(79, 70, 229, 0.25);
  position: relative;
  transform: translateY(20px) scale(0.96);
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.flock-backdrop.active .flock-card {
  transform: translateY(0) scale(1);
}
.flock-close {
  position: absolute;
  top: 1rem;
  right: 1.25rem;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: #94a3b8;
  font-size: 1.2rem;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}
.flock-close:hover {
  background: rgba(239, 68, 68, 0.2);
  color: #ef4444;
  border-color: #ef4444;
}
.flock-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  background: rgba(79, 70, 229, 0.2);
  border: 1px solid rgba(99, 102, 241, 0.4);
  color: #818cf8;
  font-size: 0.72rem;
  font-weight: 800;
  padding: 0.25rem 0.7rem;
  border-radius: 999px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 0.85rem;
}
.flock-title {
  font-size: 1.35rem;
  font-weight: 800;
  color: #ffffff;
  margin-bottom: 0.5rem;
  line-height: 1.3;
}
.flock-desc {
  font-size: 0.85rem;
  color: #94a3b8;
  line-height: 1.5;
  margin-bottom: 1.25rem;
}
.flock-list {
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.08);
  padding: 1rem;
  border-radius: 12px;
  margin-bottom: 1.5rem;
}
.flock-item {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  font-size: 0.82rem;
  color: #e2e8f0;
  font-weight: 600;
}
.flock-check {
  color: #10b981;
  font-weight: 800;
  font-size: 0.95rem;
}
.flock-btn-cta {
  width: 100%;
  background: linear-gradient(135deg, #4f46e5, #7c3aed);
  color: #ffffff;
  border: none;
  padding: 0.85rem 1.25rem;
  border-radius: 12px;
  font-weight: 800;
  font-size: 0.92rem;
  cursor: pointer;
  box-shadow: 0 8px 20px rgba(79, 70, 229, 0.4);
  transition: all 0.25s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  text-decoration: none;
}
.flock-btn-cta:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 25px rgba(79, 70, 229, 0.55);
}
</style>

<div class="flock-backdrop" id="featureLockBackdrop" role="dialog" aria-modal="true">
  <div class="flock-card">
    <button type="button" class="flock-close" onclick="closeFeatureLockModal()">&times;</button>
    <div class="flock-badge">🔒 ENROLLED STUDENT FEATURE</div>
    <h3 class="flock-title" id="flockTitle">Unlock Full Curriculum & Doubt Desk</h3>
    <p class="flock-desc" id="flockDesc">You are currently in Guest Code Arena Preview Mode. Complete your enrollment to unlock 1-on-1 faculty doubts, video lectures, and certificates.</p>
    
    <div class="flock-list">
      <div class="flock-item"><span class="flock-check">✓</span> <span>1-on-1 Live Faculty Chat & Instant Code Reviews</span></div>
      <div class="flock-item"><span class="flock-check">✓</span> <span>12+ Full Stack & GenAI Industry Capstone Projects</span></div>
      <div class="flock-item"><span class="flock-check">✓</span> <span>Verified Certificate of Mastery + 100% Placement Support</span></div>
    </div>

    <a href="enroll.php" id="flockCtaBtn" class="flock-btn-cta">
      🚀 Unlock Feature & Enroll Now &rarr;
    </a>
  </div>
</div>

<script>
function openFeatureLockModal(featureKey, featureTitle) {
  const backdrop = document.getElementById('featureLockBackdrop');
  const titleEl = document.getElementById('flockTitle');
  const descEl = document.getElementById('flockDesc');
  const ctaBtn = document.getElementById('flockCtaBtn');
  
  if (titleEl && featureTitle) {
    titleEl.textContent = 'Unlock ' + featureTitle;
  }
  if (descEl) {
    descEl.textContent = 'Access to ' + (featureTitle || 'this feature') + ' requires an active enrollment. Join the 2026 Live Cohort to unlock full platform access!';
  }
  if (ctaBtn) {
    ctaBtn.href = 'enroll.php?feature=' + encodeURIComponent(featureKey || 'general') + '&source=code_arena';
  }
  if (backdrop) {
    backdrop.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
}

function closeFeatureLockModal() {
  const backdrop = document.getElementById('featureLockBackdrop');
  if (backdrop) {
    backdrop.classList.remove('active');
    document.body.style.overflow = '';
  }
}

document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') closeFeatureLockModal();
});
</script>
