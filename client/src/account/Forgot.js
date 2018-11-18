'use strict';

import React, { Component } from 'react';
import { withTranslation } from '../lib/i18n';
import { withPageHelpers, Title } from '../lib/page'
import {
    withForm, Form, FormSendMethod, InputField, ButtonRow, Button
} from '../lib/form';
import { withErrorHandling, withAsyncErrorHandler } from '../lib/error-handling';

@withTranslation()
@withForm
@withPageHelpers
@withErrorHandling
export default class Forget extends Component {
    constructor(props) {
        super(props);

        this.state = {};

        this.initForm();
    }

    componentDidMount() {
        this.populateFormValues({
            usernameOrEmail: this.props.match.params.username || ''
        });
    }

    localValidateFormValues(state) {
        const t = this.props.t;

        const username = state.getIn(['usernameOrEmail', 'value']);
        if (!username) {
            state.setIn(['usernameOrEmail', 'error'], t('usernameOrEmailMustNotBeEmpty'));
        } else {
            state.setIn(['usernameOrEmail', 'error'], null);
        }
    }

    async submitHandler() {
        const t = this.props.t;

        this.disableForm();
        this.setFormStatusMessage('info', t('processing'));

        const submitSuccessful = await this.validateAndSendFormValuesToURL(FormSendMethod.POST, 'rest/password-reset-send');

        if (submitSuccessful) {
            this.navigateToWithFlashMessage('/account/login', 'success', t('ifTheUsernameEmailExistsInTheSystem'));
        } else {
            this.enableForm();
            this.setFormStatusMessage('warning', t('pleaseEnterYourUsernameEmailAndTryAgain'));
        }
    }

    render() {
        const t = this.props.t;

        return (
            <div>
                <Title>{t('passwordReset')}</Title>

                <p>{t('pleaseProvideTheUsernameOrEmailAddress')}</p>

                <p>{t('weWillSendYouAnEmailThatWillAllowYouTo')}</p>

                <Form stateOwner={this} onSubmitAsync={::this.submitHandler}>
                    <InputField id="usernameOrEmail" label={t('usernameOrEmail')}/>

                    <ButtonRow>
                        <Button type="submit" className="btn-primary" icon="ok" label={t('sendEmail')}/>
                    </ButtonRow>
                </Form>
            </div>
        );
    }
}
