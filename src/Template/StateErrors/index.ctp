<?php
/**
 * @var \App\View\AppView $this
 * @var \App\Model\Entity\StateError[]|\Cake\Collection\CollectionInterface $stateErrors
 */
?>
<nav id="actions-sidebar">
    <ul class="nav-horizontal nav-smaller">
        <li class="heading"><?= __('Actions') ?></li>
        <li><?= $this->Html->link(__('New State Error'), ['action' => 'add']) ?></li>
        <li><?= $this->Html->link(__('List State Users'), ['controller' => 'StateUsers', 'action' => 'index']) ?></li>
        <li><?= $this->Html->link(__('New State User'), ['controller' => 'StateUsers', 'action' => 'add']) ?></li>
        <li><?= $this->Html->link(__('List Transaction Types'), ['controller' => 'TransactionTypes', 'action' => 'index']) ?></li>
        <li><?= $this->Html->link(__('New Transaction Type'), ['controller' => 'TransactionTypes', 'action' => 'add']) ?></li>
    </ul>
</nav>
<div class="stateErrors index large-9 medium-8 columns content">
    <h3><?= __('State Errors') ?></h3>
    <table cellpadding="0" cellspacing="0">
        <thead>
            <tr>
                <th scope="col"><?= $this->Paginator->sort('id') ?></th>
                <th scope="col"><?= $this->Paginator->sort('state_user_id') ?></th>
                <th scope="col"><?= $this->Paginator->sort('transaction_type_id') ?></th>
                <th scope="col"><?= $this->Paginator->sort('created') ?></th>
                <th scope="col" class="actions"><?= __('Actions') ?></th>
            </tr>
        </thead>
        <tbody>
            <?php foreach ($stateErrors as $stateError): ?>
            <tr>
                <td><?= $this->Number->format($stateError->id) ?></td>
                <td><?= $stateError->has('state_user') ? $this->Html->link($stateError->state_user->id, ['controller' => 'StateUsers', 'action' => 'view', $stateError->state_user->id]) : '' ?></td>
                <td><?= $stateError->has('transaction_type') ? $this->Html->link($stateError->transaction_type->name, ['controller' => 'TransactionTypes', 'action' => 'view', $stateError->transaction_type->id]) : '' ?></td>
                <td><?= h($stateError->created) ?></td>
                <td class="actions">
                    <?= $this->Html->link(__('View'), ['action' => 'view', $stateError->id]) ?>
                    <?= $this->Html->link(__('Edit'), ['action' => 'edit', $stateError->id]) ?>
                    <?= $this->Form->postLink(__('Delete'), ['action' => 'delete', $stateError->id], ['confirm' => __('Are you sure you want to delete # {0}?', $stateError->id)]) ?>
                </td>
            </tr>
            <?php endforeach; ?>
        </tbody>
    </table>
    <div class="paginator">
        <ul class="pagination">
            <?= $this->Paginator->first('<< ' . __('first')) ?>
            <?= $this->Paginator->prev('< ' . __('previous')) ?>
            <?= $this->Paginator->numbers() ?>
            <?= $this->Paginator->next(__('next') . ' >') ?>
            <?= $this->Paginator->last(__('last') . ' >>') ?>
        </ul>
        <p><?= $this->Paginator->counter(['format' => __('Page {{page}} of {{pages}}, showing {{current}} record(s) out of {{count}} total')]) ?></p>
    </div>
</div>
