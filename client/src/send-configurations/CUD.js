'use strict';

import React, {Component} from 'react';
import PropTypes
    from 'prop-types';
import {Trans} from 'react-i18next';
import {withTranslation} from '../lib/i18n';
import {
    NavButton,
    requiresAuthenticatedUser,
    Title,
    withPageHelpers
} from '../lib/page'
import {
    Button,
    ButtonRow,
    CheckBox,
    Fieldset,
    Form,
    FormSendMethod,
    InputField,
    StaticField,
    TextArea,
    withForm
} from '../lib/form';
import {withErrorHandling} from '../lib/error-handling';
import {
    NamespaceSelect,
    validateNamespace
} from '../lib/namespace';
import {DeleteModalDialog} from "../lib/modals";

import {getMailerTypes} from "./helpers";

import {
    getSystemSendConfigurationId,
    MailerType
} from "../../../shared/send-configurations";

import styles
    from "../lib/styles.scss";

import mailtrainConfig
    from 'mailtrainConfig';


@withTranslation()
@withForm
@withPageHelpers
@withErrorHandling
@requiresAuthenticatedUser
export default class CUD extends Component {
    constructor(props) {
        super(props);

        this.mailerTypes = getMailerTypes(props.t);

        this.state = {};

        this.initForm({
            onChangeBeforeValidation: {
                mailer_type: ::this.onMailerTypeChanged
            }
        });
    }

    static propTypes = {
        action: PropTypes.string.isRequired,
        wizard: PropTypes.string,
        entity: PropTypes.object
    }

    onMailerTypeChanged(mutState, key, oldType, type) {
        if (type) {
            this.mailerTypes[type].afterTypeChange(mutState);
        }
    }


    componentDidMount() {
        if (this.props.entity) {
            this.getFormValuesFromEntity(this.props.entity, data => {
                this.mailerTypes[data.mailer_type].afterLoad(data);
                data.verpEnabled = !!data.verp_hostname;
            });

        } else {
            this.populateFormValues({
                name: '',
                description: '',
                namespace: mailtrainConfig.user.namespace,
                from_email_overridable: false,
                from_name_overridable: false,
                reply_to_overridable: false,
                subject_overridable: false,
                verpEnabled: false,
                verp_hostname: '',
                x_mailer: '',
                mailer_type: MailerType.ZONE_MTA,
                ...this.mailerTypes[MailerType.ZONE_MTA].initData()
            });
        }
    }

    localValidateFormValues(state) {
        const t = this.props.t;

        const typeKey = state.getIn(['mailer_type', 'value']);

        if (!state.getIn(['name', 'value'])) {
            state.setIn(['name', 'error'], t('nameMustNotBeEmpty'));
        } else {
            state.setIn(['name', 'error'], null);
        }

        if (!typeKey) {
            state.setIn(['mailer_type', 'error'], t('mailerTypeMustBeSelected'));
        } else {
            state.setIn(['mailer_type', 'error'], null);
        }

        if (state.getIn(['verpEnabled', 'value']) && !state.getIn(['verp_hostname', 'value'])) {
            state.setIn(['verp_hostname', 'error'], t('verpHostnameMustNotBeEmpty'));
        } else {
            state.setIn(['verp_hostname', 'error'], null);
        }

        validateNamespace(t, state);

        if (typeKey) {
            this.mailerTypes[typeKey].validate(state);
        }
    }

    async submitHandler() {
        const t = this.props.t;

        let sendMethod, url;
        if (this.props.entity) {
            sendMethod = FormSendMethod.PUT;
            url = `rest/send-configurations/${this.props.entity.id}`
        } else {
            sendMethod = FormSendMethod.POST;
            url = 'rest/send-configurations'
        }

        this.disableForm();
        this.setFormStatusMessage('info', t('saving'));

        const submitSuccessful = await this.validateAndSendFormValuesToURL(sendMethod, url, data => {
            this.mailerTypes[data.mailer_type].beforeSave(data);
            if (!data.verpEnabled) {
                data.verp_hostname = null;
            }
        });

        if (submitSuccessful) {
            this.navigateToWithFlashMessage('/send-configurations', 'success', t('sendConfigurationSaved'));
        } else {
            this.enableForm();
            this.setFormStatusMessage('warning', t('thereAreErrorsInTheFormPleaseFixThemAnd'));
        }
    }

    render() {
        const t = this.props.t;
        const isEdit = !!this.props.entity;
        const canDelete = isEdit && this.props.entity.permissions.includes('delete') && this.props.entity.id !== getSystemSendConfigurationId();

        const typeKey = this.getFormValue('mailer_type');
        let mailerForm = null;
        if (typeKey) {
            mailerForm = this.mailerTypes[typeKey].getForm(this);
        }

        const verpEnabled = this.getFormValue('verpEnabled');

        return (
            <div>
                {canDelete &&
                    <DeleteModalDialog
                        stateOwner={this}
                        visible={this.props.action === 'delete'}
                        deleteUrl={`rest/send-configurations/${this.props.entity.id}`}
                        backUrl={`/send-configurations/${this.props.entity.id}/edit`}
                        successUrl="/send-configurations"
                        deletingMsg={t('deletingSendConfiguration')}
                        deletedMsg={t('sendConfigurationDeleted')}/>
                }

                <Title>{isEdit ? t('editSendConfiguration') : t('createSendConfiguration')}</Title>

                <Form stateOwner={this} onSubmitAsync={::this.submitHandler}>

                    <InputField id="name" label={t('name')}/>

                    {isEdit &&
                    <StaticField id="cid" className={styles.formDisabled} label={t('id')}>
                        {this.getFormValue('cid')}
                    </StaticField>
                    }

                    <TextArea id="description" label={t('description')}/>
                    <NamespaceSelect/>

                    <Fieldset label={t('emailHeader')}>
                        <InputField id="from_email" label={t('defaultFromEmail')}/>
                        <CheckBox id="from_email_overridable" text={t('overridable')}/>
                        <InputField id="from_name" label={t('defaultFromName')}/>
                        <CheckBox id="from_name_overridable" text={t('overridable')}/>
                        <InputField id="reply_to" label={t('defaultReplytoEmail')}/>
                        <CheckBox id="reply_to_overridable" text={t('overridable')}/>
                        <InputField id="subject" label={t('subject')}/>
                        <CheckBox id="subject_overridable" text={t('overridable')}/>
                        <InputField id="x_mailer" label={t('xMailer')}/>
                    </Fieldset>

                    {mailerForm}
                    {/* TODO - add "Check mail config" button */}

                    <Fieldset label={t('verpBounceHandling')}>
                        <Trans i18nKey="mailtrainIsAbleToUseVerpBasedRoutingTo"><p>Mailtrain is able to use VERP based routing to detect bounces. In this case the message is sent to the recipient using a custom VERP address as the return path of the message. If the message is not accepted a bounce email is sent to this special VERP address and thus a bounce is detected.</p></Trans>
                        <Trans i18nKey="toGetVerpWorkingYouNeedToSetUpADnsMx"><p>To get VERP working you need to set up a DNS MX record that points to your Mailtrain hostname. You must also ensure that Mailtrain VERP interface is available from port 25 of your server (port 25 usually requires root user privileges). This way if anyone tries to send email to someuser@verp-hostname then the email should end up to this server.</p></Trans>
                        <Trans i18nKey="verpUsuallyOnlyWorksIfYouAreUsingYourOwn"><p className="text-warning">VERP usually only works if you are using your own SMTP server. Regular relay services (SES, SparkPost, Gmail etc.) tend to remove the VERP address from the message.</p></Trans>
                        {mailtrainConfig.verpEnabled ?
                            <div>
                                <CheckBox id="verpEnabled" text={t('verpEnabled')}/>
                                {verpEnabled && <InputField id="verp_hostname" label={t('serverHostname')} placeholder={t('theVerpServerHostnameEgBouncesexamplecom')} help={t('verpBounceHandlingServerHostnameThis')}/>}
                            </div>
                            :
                            <Trans i18nKey="verpBounceHandlingServerIsNotEnabled"><p>VERP bounce handling server is not enabled. Modify your server configuration file and restart server to enable it.</p></Trans>
                        }
                    </Fieldset>

                    <hr/>

                    <ButtonRow>
                        <Button type="submit" className="btn-primary" icon="ok" label={t('save')}/>
                        {canDelete &&
                            <NavButton className="btn-danger" icon="remove" label={t('delete')} linkTo={`/send-configurations/${this.props.entity.id}/delete`}/>
                        }
                    </ButtonRow>
                </Form>
            </div>
        );
    }
}
