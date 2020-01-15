<?php

/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

if(isset($user)) {
  //var_dump($user);
}
$this->assign('title', __('Willkommen') . '&nbsp;' . $user['first_name'] . '&nbsp;' . $user['last_name']);
?>
<?php if(isset($requestTime)) : ?>
  <span class='grd-second-timer'><?= round($requestTime * 1000.0) ?> ms</span>
<?php endif; ?>
  <div class="grd_container_small">
    
    <fieldset>
      <h3>Gradido ...</h3>
      <?= $this->Html->link(
              __('übersicht'),
              ['controller' => 'StateBalances', 'action' => 'overview'],
              ['class' => 'grd-nav-bn grd-nav-bn-large']
          );?>
      <?= $this->Html->link(
              __('überweisen'), 
              ['controller' => 'TransactionSendCoins', 'action' => 'create'], 
              ['class' => 'grd-nav-bn grd-nav-bn-large']
          ); ?>
    </fieldset>
    <!--<fieldset class="grd-margin-top-10">
      <h3>Account ...</h3>
      <a class="grd-nav-bn" href="./account/user_delete"><?= __("löschen"); ?></a>
    </fieldset>-->
    <?php if($serverUser != null) : ?>
    <fieldset class="grd-margin-top-10">
      <h3>Server Admin Gradido ...</h3>
      <?= $this->Html->link(
              __('einzeln schöpfen'),
              ['controller' => 'TransactionCreations', 'action' => 'create'],
              ['class' => 'grd-nav-bn grd-nav-bn-large']
          );?>
      <?= $this->Html->link(
              __('viele schöpfen'),
              ['controller' => 'TransactionCreations', 'action' => 'createMulti'],
              ['class' => 'grd-nav-bn grd-nav-bn-large']
          );?>
    </fieldset>
    <?= $this->Html->link(
              __('Fehler') . ' (' . $adminErrorCount . ')',
              ['controller' => 'AdminErrors'], ['class' => 'grd-nav-bn']);
    ?>
    <?php endif; ?>
    <?php if($user['role'] == 'admin') : ?>
    <fieldset class="grd-margin-top-10">
      <h3>Adminbereich</h3>
      <?= $this->Html->link(
              __('Benutzer suchen'),
              ['controller' => 'StateUsers', 'action' => 'search'],
              ['class' => 'grd-nav-bn grd-nav-bn-large']
              ); ?>
    </fieldset>
    <?php endif; ?>
    
  </div>
