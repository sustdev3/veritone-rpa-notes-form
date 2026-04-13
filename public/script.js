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
    var APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzlreCHhiyBD9FWDSYsFRIVqC6iLj7TrtjrdcM96FLM6AwjNAWpFObSzPTtVb5PcThp/exec'; // TODO: replace with your deployed Google Apps Script web app URL

    function submitForm() {
      if (!validate()) {
        var firstError = document.querySelector('.field-error.show, .has-error');
        if (firstError) firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }
    
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
    
      // FIXED: Send as JSON with correct header
      fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },  // ← JSON header
        body: JSON.stringify(payload)  // ← Send JSON directly
      })
      .then(function() {
        console.log('Form submitted successfully!');
        document.getElementById('screeningForm').style.display = 'none';
        document.getElementById('successScreen').classList.add('show');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      })
      .catch(function(error) {
        console.error('Network error:', error);
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
    