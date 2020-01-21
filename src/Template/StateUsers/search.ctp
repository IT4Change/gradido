<?php

/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

$this->assign('title', __('Benutzer suchen'));
// In a View class
$this->loadHelper('Form', [
    'templates' => 'ripple_control_group_form',
]);//*/
?>
<div class="row">
  <div class="col-md-10 equel-grid">
    <div class="grid">
      <p class="grid-header">Benutzer suchen</p>
      <div class="grid-body">
        <div class="item-wrapper">
          <div class="row mb-3">
            <div class="col-md-10 mx-auto">
              <?= $this->Form->create($searchForm, ['class' => 't-header-search-box']) ?>
                  <?= $this->Form->control('search', ['label' => false, 'class' => 'form-control', 'id' => 'inlineFormInputGroup', 'placeholder' => __('Vorname oder Nachname oder E-Mail')]) ?>
              <?= $this->Form->button('<i class="mdi mdi-magnify"></i>&nbsp;' . __('Datenbank durchsuchen'), ['class' => 'btn btn-sm btn-primary']) ?>
              <?= $this->Form->hidden('order_row', ['id' => 'input-order-row']) ?>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
<div class="row">
  <div class="col-md-12 equel-grid">
    <div class="grid">
      <div id="gradido-mithril-user-search"></div>
    </div>
  </div>
</div>
<?php // adding scripts vendor and core from ripple ui for popup/tooltip ?>
<script type="text/javascript">
  <?php if(isset($finalUserEntrys)) : ?>
    g_users = <?= json_encode($finalUserEntrys); ?>;
  <?php endif; ?>
</script>
<?= $this->Html->script('userSearch.min') ?>