<?
if(!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED!==true) die();
?>
<script type="text/javascript">
if (window.JCCalendarViewYear)
	jsBXAC.SetViewHandler(new JCCalendarViewYear());
else
	BX.loadScript(
		'<?=$templateFolder?>/view.js', 
		function() {jsBXAC.SetViewHandler(new JCCalendarViewYear())}
	);
</script>