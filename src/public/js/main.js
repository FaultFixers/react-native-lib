function showAlert(title, message, onClose) {
    if (!title) {
        throw new Error('No title given for alert');
    }
    if (!message) {
        throw new Error('No message given for alert');
    }

    const modal = $('#alert-modal');
    modal.find('h1').text(title);
    modal.find('p').text(message);
    modal.find('button').click(() => {
        $.modal.close();
    });
    modal.modal();

    modal.unbind($.modal.CLOSE);

    if (onClose) {
        modal.on($.modal.CLOSE, function() {
            onClose();
            modal.unbind($.modal.CLOSE);
        });
    }
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
                    window.location = '/locations/' + response.location.id;
                    break;
                case 'SINGLE_BUILDING':
                    window.location = '/buildings/' + response.building.id;
                    break;
                case 'SINGLE_ACCOUNT':
                    window.location = '/account-tickets';
                    break;
                case 'MULTIPLE_BUILDING_OPTIONS':
                    const ids = response.buildingOptions.map(building => building.id);
                    window.location = '/building-options?ids=' + ids.join(',');
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
                showAlert('Check Your Email', 'We have emailed you a link to set a new password.', function() {
                    window.location = '/login?email=' + window.encodeURIComponent(email);
                });
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

    const reportForm = $('#report-form');
    const privacyOptionButtons = reportForm.find('button.ticket-privacy-option');
    privacyOptionButtons.click(function(event) {
        privacyOptionButtons.removeClass('active');

        const button = $(event.target);
        button.addClass('active');

        $('.ticket-privacy-note').text(button.attr('note'));
    });
    reportForm.submit(function(event) {
        event.preventDefault();

        const accountId = reportForm.find('input[name="accountId"]').val();
        const buildingId = reportForm.find('input[name="buildingId"]').val();
        const locationId = reportForm.find('input[name="locationId"]').val();

        let privacy;
        if (privacyOptionButtons.length > 0) {
            privacy = privacyOptionButtons.filter('.active').attr('value');
            if (!privacy) {
                showAlert('Not yet!', 'Please choose whether this is a communal or private issue.');
                return;
            }
        }

        let locationDescription;
        if (!locationId) {
            locationDescription = reportForm.find('textarea[name="locationDescription"]').val();
            if (!locationDescription) {
                showAlert('Not yet!', 'Please enter where the fault is located.');
                return;
            }
        }

        const description = reportForm.find('textarea[name="description"]').val();
        if (!description) {
            showAlert('Not yet!', 'Please enter a quick description of the fault.');
            return;
        }

        const faultCategoryId = reportForm.find('select[name="faultCategoryId"]').val();
        if (!faultCategoryId) {
            showAlert('Not yet!', 'Please choose a fault category. Tap "Other" if you can\'t decide which is most approriate.');
            return;
        }

        const additionalQuestionAnswers = reportForm.find('input[type="hidden"].questionId')
            .toArray()
            .map(questionId => {
                questionId = questionId.getAttribute('value');
                const answers = reportForm.find('input[name="question-' + questionId + '"]:checked')
                    .toArray()
                    .map(input => input.getAttribute('data-option') + ': ' + input.getAttribute('data-header'));
                return {
                    question: questionId,
                    answers: answers,
                };
            });

        const fileList = document.querySelector('input[name="image"]').files;
        let imageFile;
        if (fileList.length > 0) {
            imageFile = fileList[0];
        } else {
            const confirmToContinue = window.confirm('Are you sure you want to continue without adding a photo?');
            if (!confirmToContinue) {
                console.log('User chose to not continue without adding an image');
                return;
            }
        }

        const openedAt = Number(reportForm.find('input[name="openedAt"]').val());

        let imageId;

        function createTicket() {
            const postBody = {
                description: description ? description : null,
                locationDescription: locationDescription ? locationDescription : null,
                additionalQuestionAnswers: additionalQuestionAnswers ? additionalQuestionAnswers : [],
                privacy: privacy ? privacy : null,
                images: imageId ? [imageId] : null,
                location: locationId ? locationId : null,
                building: buildingId ? buildingId : null,
                account: accountId ? accountId : null,
                faultCategory: faultCategoryId ? faultCategoryId : null,
                timeToCreateTicketInMs: Date.now() - openedAt,
            };

            doApiPostRequest(
                '/tickets',
                postBody,
                function(response) {
                    hideLoadingAnimation();

                    const successModal = $('#report-success-modal');
                    if (response.textAfterTicketCreation) {
                        const newHtml = '<p>' + response.textAfterTicketCreation.replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br />') + '</p>';
                        successModal.html(newHtml);
                    }
                    successModal.modal();

                    console.log('Created ticket', response.ticket.id);

                    const goToTicket = () => window.location = '/tickets/' + response.ticket.friendlyId;

                    setTimeout(goToTicket, 3000);
                    successModal.click(goToTicket);
                },
                function(error) {
                    let errorMessage;
                    if (error.status === -1) {
                        errorMessage = 'We couldn\'t report the fault. Please check you are connected to the Internet.';
                    } else {
                        errorMessage = 'An unexpected error occurred - please try again.';
                    }
                    showAlert('Problem Reporting Fault', errorMessage);
                    hideLoadingAnimation();
                    console.error('Error reporting fault', error);
                }
            );
        }

        showLoadingAnimation();

        if (imageFile) {
            console.log('User has chosen a fault image to upload');
            doApiFileUpload(
                imageFile,
                response => {
                    imageId = response.image.id;
                    console.log('Uploaded fault image', {imageId});
                    createTicket();
                },
                error => {
                    let message;
                    if (error.responseJSON.exception === 'MaxUploadSizeExceededException') {
                        message = 'Sorry, the photo you added is too large.';
                    } else {
                        message = 'Sorry, something went wrong. Please try again.';
                    }
                    showAlert('Error!', message);
                    hideLoadingAnimation();
                }
            );
        } else {
            console.log('No fault image to upload');
            createTicket();
        }
    });
});
