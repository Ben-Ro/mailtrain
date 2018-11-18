'use strict';

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { withTranslation } from '../../lib/i18n';
import {requiresAuthenticatedUser, withPageHelpers, Title, Toolbar, NavButton} from '../../lib/page';
import { withErrorHandling } from '../../lib/error-handling';
import { Table } from '../../lib/table';
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
    }

    static propTypes = {
        list: PropTypes.object
    }

    componentDidMount() {
    }

    render() {
        const t = this.props.t;

        const columns = [
            { data: 1, title: t('name') },
            {
                actions: data => {
                    const actions = [];

                    if (this.props.list.permissions.includes('manageSegments')) {
                        actions.push({
                            label: <Icon icon="edit" title={t('edit')}/>,
                            link: `/lists/${this.props.list.id}/segments/${data[0]}/edit`
                        });

                        tableDeleteDialogAddDeleteButton(actions, this, null, data[0], data[1]);
                    }

                    return actions;
                }
            }
        ];

        return (
            <div>
                {tableDeleteDialogRender(this, `rest/segments/${this.props.list.id}`, t('deletingSegment'), t('segmentDeleted'))}
                {this.props.list.permissions.includes('manageSegments') &&
                    <Toolbar>
                        <NavButton linkTo={`/lists/${this.props.list.id}/segments/create`} className="btn-primary" icon="plus" label={t('createSegment')}/>
                    </Toolbar>
                }

                <Title>{t('segment')}</Title>

                <Table ref={node => this.table = node} withHeader dataUrl={`rest/segments-table/${this.props.list.id}`} columns={columns} />
            </div>
        );
    }
}