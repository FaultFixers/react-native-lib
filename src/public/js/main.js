function showAlert(title, message) {
    // @todo - replace with a nicer design.
    window.alert(`${title}\n\n${message}`);
}

function setLoadingAnimationDisplay(value) {
    const animation = document.querySelector('.loading-animation');
    window.requestAnimationFrame(() => animation.style.display = value);
}

function showLoadingAnimation() {
    setLoadingAnimationDisplay('block');
}

function hideLoadingAnimation() {
    setLoadingAnimationDisplay('none');
}

$(document).ready(function() {
    const enterCodeForm = $('#enter-code-form');
    enterCodeForm.submit(function(event) {
        event.preventDefault();

        const code = enterCodeForm.find('input[name="code"]').val();
        if (!code) {
            return;
        }

        // @todo - show loading animation

        $.get('/api/check-code?code=' + code)
            .then(response => {
                console.log('Got code', response);
                // @todo - handle success.
            })
            .catch(error => {
                showAlert('Nope!', `The code you entered (${code}) is not valid`);
                console.error('Error checking code', error);
            });
    });

    const loginForm = $('#login-form');
    loginForm.submit(function(event) {
        event.preventDefault();

        const email = loginForm.find('input[name="email"]').val();
        if (!email) {
            showAlert('Not yet!', 'Please enter your email address.');
            return;
        }

        const password = loginForm.find('input[name="password"]').val();
        if (!password) {
            showAlert('Not yet!', 'Please enter your password.');
            return;
        }

        const continueTo = loginForm.find('input[name="continueTo"]').val();

        showLoadingAnimation();

        $.ajax({
            url: '/api/login',
            type: 'POST',
            dataType: 'json',
            data: JSON.stringify({email, password}),
            contentType: 'application/json',
            success() {
                if (continueTo) {
                    window.location = continueTo;
                } else {
                    window.location = '/';
                }
            },
            error() {
                showAlert(
                    'Login failed',
                    'The email and password you gave don\'t match an account on our system. Please double check your email and password and try again.'
                );
                hideLoadingAnimation();
            },
        });
    });

    const personalDetailsForm = $('#personal-details-form');
    personalDetailsForm.submit(function(event) {
        event.preventDefault();

        const emailInput = personalDetailsForm.find('input[name="email"]');
        const nameInput = personalDetailsForm.find('input[name="full-name"]');
        const phoneNumberInput = personalDetailsForm.find('input[name="phone-number"]');

        const email = emailInput.val();
        if (!email) {
            showAlert('Not yet!', 'Please enter your email address.');
            return;
        }

        const name = nameInput.val();
        if (!name) {
            showAlert('Not yet!', 'Please enter your name.');
            return;
        }

        const phoneNumber = phoneNumberInput.val();
        if (!phoneNumber) {
            showAlert('Not yet!', 'Please enter your phone number. This may be used if we can\'t find an issue that you reported.');
            return;
        }

        showLoadingAnimation();

        $.ajax({
            url: '/api/personal-details',
            type: 'POST',
            dataType: 'json',
            data: JSON.stringify({email, name, phoneNumber}),
            contentType: 'application/json',
            success(response) {
                emailInput.val(response.user.email);
                nameInput.val(response.user.name);
                phoneNumberInput.val(response.user.phoneNumber);
                showAlert('Done!', 'We\'ve saved your changes.');
                hideLoadingAnimation();
            },
            error() {
                showAlert('Uh-oh!', 'An error occurred. Please check the details you provided and try again.');
                hideLoadingAnimation();
            },
        });
    });

    const changePasswordForm = $('#change-password-form');
    changePasswordForm.submit(function(event) {
        event.preventDefault();

        const oldPasswordInput = changePasswordForm.find('input[name="old-password"]');
        const newPasswordInput = changePasswordForm.find('input[name="new-password"]');
        const newPasswordConfirmationInput = changePasswordForm.find('input[name="new-password-confirmation"]');

        const oldPassword = oldPasswordInput.val();
        if (!oldPassword) {
            showAlert('Not yet!', 'Please enter your current password.');
            return;
        }

        const newPassword = newPasswordInput.val();
        if (!newPassword) {
            showAlert('Not yet!', 'Please enter your new password.');
            return;
        }

        const newPasswordConfirmation = newPasswordConfirmationInput.val();
        if (!newPasswordConfirmation) {
            showAlert('Not yet!', 'Please enter your new password again.');
            return;
        }

        if (newPassword !== newPasswordConfirmation) {
            showAlert('Passwords do not match', 'The new password you entered doesn\'t match the confirmation. Please enter them again.');
            return;
        }

        showLoadingAnimation();

        $.ajax({
            url: '/api/change-password',
            type: 'POST',
            dataType: 'json',
            data: JSON.stringify({oldPassword, newPassword}),
            contentType: 'application/json',
            success() {
                oldPasswordInput.val('');
                newPasswordInput.val('');
                newPasswordConfirmationInput.val('');
                showAlert('Done!', 'We\'ve saved your new password.');
                hideLoadingAnimation();
            },
            error(response) {
                console.log('response', response.responseJSON);
                if (response.responseJSON && response.responseJSON.isNewPasswordTooShort) {
                    showAlert('Uh-oh!', 'Your new password is too short.');
                } else {
                    showAlert('Uh-oh!', 'An error occurred. Please check the details you provided and try again.');
                }
                hideLoadingAnimation();
            },
        });
    });

    const forgotPasswordForm = $('#forgot-password-form');
    forgotPasswordForm.submit(function(event) {
        event.preventDefault();

        const emailInput = forgotPasswordForm.find('input[name="email"]');

        const email = emailInput.val();
        if (!email) {
            showAlert('Not yet!', 'Please enter your email address.');
            return;
        }

        showLoadingAnimation();

        $.ajax({
            url: '/api/request-password-reset',
            type: 'POST',
            dataType: 'json',
            data: JSON.stringify({email}),
            contentType: 'application/json',
            success() {
                showAlert('Check Your Email', 'We have emailed you a link to set a new password.');
                window.location = '/login?email=' + window.encodeURIComponent(email);
                hideLoadingAnimation();
            },
            error(response) {
                console.log('response', response.responseJSON);
                if (response.responseJSON && response.responseJSON.isInvalidEmail) {
                    showAlert('Uh-oh!', 'The email given doesn\'t exist.');
                } else {
                    showAlert('Uh-oh!', 'An error occurred. Please check the details you provided and try again.');
                }
                hideLoadingAnimation();
            },
        });
    });

    const logOutForm = $('#log-out-form');
    logOutForm.submit(function(event) {
        const confirmed = window.confirm('Are you sure you want to log out?');
        if (!confirmed) {
            event.preventDefault();
        }
    });
});
