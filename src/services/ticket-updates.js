const {
    conjoinWithCommasAndWord,
    getShortUserDescription,
} = require('faultfixers-js-lib');

function getUpdateTitle(update) {
    if (update.hasStatusChanged) {
        switch (update.newStatus) {
        case 'NEW':
            return 'Ticket opened';
        case 'IN_PROGRESS':
            return (update.oldStatus === 'CLOSED' ? 'Re-opened' : 'Resolution in progress');
        case 'CLOSED':
            return 'Resolved';
        }
    }
    if (update.hasInternalAction) {
        switch (update.internalActionType) {
        case 'ADD_IMAGE':
            return 'Photo added';
        case 'ADD_FILE':
            return 'File added';
        case 'CHECK_IN':
            return 'Checked in';
        case 'CHECK_OUT':
            return 'Checked out';
        case 'RECORD_EXPENSE':
            return 'Expense recorded';
        case 'RECORD_TRAVEL_MILEAGE':
            return 'Travel mileage recorded';
        case 'RECORD_WASTE':
            return 'Waste recorded';
        }
    }
    if (update.haveAssigneesChanged) {
        if (update.newAssignees.isSet) {
            const names = update.newAssignees.users.map(getShortUserDescription)
                .concat(update.newAssignees.accounts.map(account => account.name));
            const conjoined = conjoinWithCommasAndWord(names, 'and');
            return `Assigned to ${conjoined}`;
        } else {
            const names = update.oldAssignees.users.map(getShortUserDescription)
                .concat(update.oldAssignees.accounts.map(account => account.name));
            const conjoined = conjoinWithCommasAndWord(names, 'and');
            return `Un-assigned from ${conjoined}`;
        }
    }
    if (update.hasDueChanged) {
        if (update.isDueSet) {
            return 'Due date set';
        } else {
            return 'Due date removed';
        }
    }
    if (update.hasPriorityChanged) {
        return 'Priority set';
    }
    if (update.hasBuildingChanged) {
        return 'Building set';
    }
    if (update.hasCategoryChanged) {
        return 'Category changed';
    }
    if (update.hasDescriptionChanged) {
        return 'Description changed';
    }
    if (update.hasNewFormInstance) {
        return 'Form attached';
    }
    if (update.hasComment) {
        return 'Comment';
    }
    return null;
}

function getUpdateIcon(update) {
    if (update.hasStatusChanged) {
        if (update.newStatus === 'NEW') {
            return 'ff-ticket-opened-circled';
        } else if (update.newStatus === 'IN_PROGRESS') {
            if (update.oldStatus === 'CLOSED') {
                return 'ff-ticket-reopened-circled';
            } else {
                return 'ff-ticket-in-progress-circled';
            }
        } else if (update.newStatus === 'CLOSED') {
            return 'ff-ticket-closed-circled';
        }
    }
    if (update.hasInternalAction) {
        switch (update.internalActionType) {
        case 'ADD_IMAGE':
            return 'ff-camera-circled';
        case 'ADD_FILE':
            return 'ff-attach-circled';
        case 'CHECK_IN':
            return 'ff-check-in-circled';
        case 'CHECK_OUT':
            return 'ff-check-out-circled';
        case 'RECORD_EXPENSE':
            return 'ff-expense-circled';
        case 'RECORD_TRAVEL_MILEAGE':
            return 'ff-mileage-circled';
        case 'RECORD_WASTE':
            return 'ff-waste-circled';
        }
    }
    if (update.haveAssigneesChanged) {
        if (update.newAssignees.isSet) {
            return 'ff-ticket-assigned-circled';
        } else {
            return 'ff-ticket-unassigned-circled';
        }
    }
    if (update.hasDueChanged) {
        return 'ff-due-date-time-circled';
    }
    if (update.hasPriorityChanged) {
        return 'ff-priority-circled';
    }
    if (update.hasBuildingChanged) {
        return 'ff-building-circled';
    }
    if (update.hasCategoryChanged) {
        return 'ff-category-circled';
    }
    if (update.hasDescriptionChanged) {
        return 'ff-rename-circled';
    }
    if (update.hasNewFormInstance) {
        return 'ff-form-circled';
    }
    if (update.hasComment) {
        return 'ff-ticket-comment-circled';
    }

    return null;
}

function getUpdateUpdaterDescription(update, isOwnTicket) {
    if (update.isByReporter && isOwnTicket) {
        return 'you';
    } else if (update.isByReporter) {
        return 'the reporter';
    } else if (update.isByFacilityManager) {
        return 'the maintenance team';
    }
    return null;
}

function getUpdateCommentVisibility(update) {
    switch (update.commentVisibility) {
    case 'PUBLIC':
        return 'Public comment';
    case 'PRIVATE_TO_REPORTER':
        return 'Private comment';
    case 'INTERNAL_TO_TEAM':
        return 'Internal comment';
    }
    return null;
}

module.exports = {
    getUpdateTitle,
    getUpdateIcon,
    getUpdateUpdaterDescription,
    getUpdateCommentVisibility,
};
