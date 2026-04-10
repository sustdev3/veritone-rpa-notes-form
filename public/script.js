    // ── Read URL parameters and populate hidden fields + UI ──────────────────
    const params = new URLSearchParams(window.location.search);

    const candidateEmail = params.get('candidate_email') || '';
    const candidateName  = params.get('candidate_name') || '';
    const advertTitle    = params.get('advert_title') || '';

    document.getElementById('candidate_email').value = candidateEmail;
    document.getElementById('candidate_name').value  = candidateName;
    document.getElementById('advert_title').value    = advertTitle;

    // Personalise the intro banner
    if (candidateName) {
      document.getElementById('introTitle').textContent =
        'Hi ' + candidateName + ', please answer all questions to complete your application.';
    }
    if (advertTitle) {
      document.getElementById('introTitle').textContent = advertTitle;
    }

    // ── Abuse prevention: warn if accessed without email param ───────────────
    if (!candidateEmail) {
      console.warn('Form accessed without candidate_email parameter.');
    }

    // ── Radio card highlight on selection ────────────────────────────────────
    document.querySelectorAll('.radio-group').forEach(function(group) {
      group.querySelectorAll('input[type="radio"]').forEach(function(radio) {
        radio.addEventListener('change', function() {
          group.querySelectorAll('.radio-card').forEach(function(card) {
            card.classList.remove('selected');
          });
          radio.closest('.radio-card').classList.add('selected');

          // Clear error for this group
          var groupId = group.id; // e.g. "car_licence-group"
          var fieldName = groupId.replace('-group', '');
          var err = document.getElementById(fieldName + 'Error');
          if (err) err.classList.remove('show');
        });
      });
    });

    // ── Validation ───────────────────────────────────────────────────────────
    function validate() {
      var valid = true;

      // Suburb
      var suburb = document.getElementById('suburb');
      var suburbErr = document.getElementById('suburbError');
      if (!suburb.value.trim()) {
        suburb.classList.add('has-error');
        suburbErr.classList.add('show');
        valid = false;
      } else {
        suburb.classList.remove('has-error');
        suburbErr.classList.remove('show');
      }

      // Radio groups
      ['car_licence', 'fulltime_hours', 'immediate_start', 'preferred_shift'].forEach(function(name) {
        var selected = document.querySelector('input[name="' + name + '"]:checked');
        var err = document.getElementById(name + 'Error');
        if (!selected) {
          err.classList.add('show');
          valid = false;
        } else {
          err.classList.remove('show');
        }
      });

      return valid;
    }

    // ── Collect payload ──────────────────────────────────────────────────────
    function getPayload() {
      return {
        candidate_email:  candidateEmail,
        candidate_name:   candidateName,
        advert_title:     advertTitle,
        suburb:           document.getElementById('suburb').value.trim(),
        car_licence:      document.querySelector('input[name="car_licence"]:checked').value,
        fulltime_hours:   document.querySelector('input[name="fulltime_hours"]:checked').value,
        immediate_start:  document.querySelector('input[name="immediate_start"]:checked').value,
        preferred_shift:  document.querySelector('input[name="preferred_shift"]:checked').value,
      };
    }

    // ── Submit ───────────────────────────────────────────────────────────────
    var APPS_SCRIPT_URL = 'YOUR_GOOGLE_APPS_SCRIPT_URL_HERE'; // TODO: replace with your deployed Google Apps Script web app URL

    function submitForm() {
      if (!validate()) {
        // Scroll to first error
        var firstError = document.querySelector('.field-error.show, .has-error');
        if (firstError) firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }

      // Abuse prevention: block submissions without hidden fields
      if (!candidateEmail) {
        document.getElementById('errorBanner').querySelector('p').textContent =
          'This form must be accessed via your personalised link. Please check your email and try again.';
        document.getElementById('errorBanner').classList.add('show');
        return;
      }

      var btn = document.getElementById('submitBtn');
      btn.disabled = true;
      btn.textContent = 'Submitting…';
      document.getElementById('errorBanner').classList.remove('show');

      var payload = getPayload();

      // Google Apps Script requires form-encoded POST for no-cors requests
      var formBody = Object.keys(payload)
        .map(function(k) { return encodeURIComponent(k) + '=' + encodeURIComponent(payload[k]); })
        .join('&');

      fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors', // Required for GAS web app endpoints
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formBody,
      })
      .then(function() {
        // no-cors means we can't read the response — treat any resolved fetch as success
        document.getElementById('screeningForm').style.display = 'none';
        document.getElementById('successScreen').classList.add('show');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      })
      .catch(function() {
        btn.disabled = false;
        btn.textContent = 'Submit my answers';
        document.getElementById('errorBanner').classList.add('show');
      });
    }

    document.getElementById('screeningForm').addEventListener('submit', function(e) {
      e.preventDefault();
      submitForm();
    });

    document.getElementById('retryBtn').addEventListener('click', function() {
      document.getElementById('errorBanner').classList.remove('show');
      submitForm();
    });
    