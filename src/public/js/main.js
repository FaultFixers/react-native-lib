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

        console.debug('Checking code', code);

        showLoadingAnimation();

        $.get('/api/check-code?code=' + code)
            .then(response => {
                const tag = response.tag;
                switch (tag.type) {
                case 'SINGLE_LOCATION':
                    // @todo - handle.
                    break;
                case 'SINGLE_BUILDING':
                    window.location = '/buildings/' + response.building.id;
                    break;
                case 'SINGLE_ACCOUNT':
                    // @todo - handle.
                    break;
                case 'MULTIPLE_BUILDING_OPTIONS':
                    // @todo - handle.
                    break;
                case 'UNASSIGNED':
                    showAlert('No longer in use', `The code you entered (${code}) is no longer in use.`);
                    hideLoadingAnimation();
                    break;
                }
            })
            .catch(error => {
                showAlert('Nope!', `The code you entered (${code}) is not valid`);
                hideLoadingAnimation();
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

    const registerForm = $('#register-form');
    registerForm.submit(function(event) {
        event.preventDefault();

        const email = registerForm.find('input[name="email"]').val();
        if (!email) {
            showAlert('Not yet!', 'Please enter your email address.');
            return;
        }

        const name = registerForm.find('input[name="name"]').val();
        if (!name) {
            showAlert('Not yet!', 'Please enter your full name.');
            return;
        }

        const password = registerForm.find('input[name="password"]').val();
        if (!password) {
            showAlert('Not yet!', 'Please enter your password.');
            return;
        }

        showLoadingAnimation();

        $.ajax({
            url: '/api/register',
            type: 'POST',
            dataType: 'json',
            data: JSON.stringify({email, name, password}),
            contentType: 'application/json',
            success() {
                const continueTo = registerForm.find('input[name="continueTo"]').val();
                if (continueTo) {
                    window.location = continueTo;
                } else {
                    window.location = '/';
                }
            },
            error(error) {
                let message;
                if (error.responseJSON && error.responseJSON.isUserAlreadyExistsError) {
                    message = 'The email you entered is already registered to an account on our system. Please login instead.';
                } else {
                    message = 'Please double check the details you entered and try again.';
                }
                showAlert('Registration failed', message);
                hideLoadingAnimation();
                console.error('Error registering', {response: error.responseJSON, email, name});
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
                    showAlert('Uh-oh!', 'Your new password is too short. Please enter a password at least 6 characters long.');
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

    const resetPasswordForm = $('#reset-password-form');
    resetPasswordForm.submit(function(event) {
        event.preventDefault();

        const newPasswordInput = resetPasswordForm.find('input[name="newPassword"]');

        const newPassword = newPasswordInput.val();
        if (!newPassword) {
            showAlert('Not yet!', 'Please enter a new password.');
            return;
        }

        const userId = resetPasswordForm.find('input[name="userId"]').val();
        const changePasswordToken = resetPasswordForm.find('input[name="changePasswordToken"]').val();

        showLoadingAnimation();

        $.ajax({
            url: '/api/reset-password',
            type: 'POST',
            dataType: 'json',
            data: JSON.stringify({newPassword, userId, changePasswordToken}),
            contentType: 'application/json',
            success() {
                window.location = '/';
            },
            error(response) {
                console.log('response', response.responseJSON);
                if (response.responseJSON && response.responseJSON.isNewPasswordTooShort) {
                    showAlert('Uh-oh!', 'Your new password is too short. Please enter a password at least 6 characters long.');
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
