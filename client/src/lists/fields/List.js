'use strict';

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { withTranslation } from '../../lib/i18n';
import {requiresAuthenticatedUser, withPageHelpers, Title, Toolbar, NavButton} from '../../lib/page';
import { withErrorHandling } from '../../lib/error-handling';
import { Table } from '../../lib/table';
import { getFieldTypes } from './helpers';
import {Icon} from "../../lib/bootstrap-components";
import {
    tableDeleteDialogAddDeleteButton,
    tableDeleteDialogInit,
    tableDeleteDialogRender
} from "../../lib/modals";

@withTranslation()
@withPageHelpers
@withErrorHandling
@requiresAuthenticatedUser
export default class List extends Component {
    constructor(props) {
        super(props);

        this.state = {};
        tableDeleteDialogInit(this);

        this.fieldTypes = getFieldTypes(props.t);
    }

    static propTypes = {
        list: PropTypes.object
    }

    componentDidMount() {
    }

    render() {
        const t = this.props.t;

        const columns = [
            { data: 4, title: "#" },
            { data: 1, title: t('name'),
                render: (data, cmd, rowData) => rowData[2] === 'option' ? <span><Icon icon="record"/> {data}</span> : data
            },
            { data: 2, title: t('type'), render: data => this.fieldTypes[data].label, sortable: false, searchable: false },
            { data: 3, title: t('mergeTag') },
            {
                actions: data => {
                    const actions = [];

                    if (this.props.list.permissions.includes('manageFields')) {
                        actions.push({
                            label: <Icon icon="edit" title={t('edit')}/>,
                            link: `/lists/${this.props.list.id}/fields/${data[0]}/edit`
                        });

                        tableDeleteDialogAddDeleteButton(actions, this, null, data[0], data[1]);
                    }

                    return actions;
                }
            }
        ];

        return (
            <div>
                {tableDeleteDialogRender(this, `rest/fields/${this.props.list.id}`, t('deletingField'), t('fieldDeleted'))}
                {this.props.list.permissions.includes('manageFields') &&
                    <Toolbar>
                        <NavButton linkTo={`/lists/${this.props.list.id}/fields/create`} className="btn-primary" icon="plus" label={t('createField')}/>
                    </Toolbar>
                }

                <Title>{t('fields')}</Title>

                <Table ref={node => this.table = node} withHeader dataUrl={`rest/fields-table/${this.props.list.id}`} columns={columns} />
            </div>
        );
    }
}