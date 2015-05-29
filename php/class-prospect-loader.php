<?php

// PURPOSE: Object that stores and adds action and filter hooks

class ProspectLoader {

	protected $actions; 
	protected $filters;

	public function __construct()
	{
		$this->actions = array();
		$this->filters = array();
	} // construct()

	public function add_action($hook, $component, $callback)
	{
		array_push($this->actions, array(
			'hook'      => $hook,
			'component' => $component,
			'callback'  => $callback
		));
	} // add_action()

	public function add_filter( $hook, $component, $callback, $priority, $args)
	{
		array_push($this->filters, array(
			'hook'      => $hook,
			'component' => $component,
			'callback'  => $callback,
			'priority'  => $priority,
			'args'      => $args
		));
	} // add_filter()

	public function run()
	{
		foreach ($this->filters as $hook) {
			if ($hook['args'] == null) {
				if ($hook['priority'] == null)
					add_filter($hook['hook'], array($hook['component'], $hook['callback']));
				else
					add_filter($hook['hook'], array($hook['component'], $hook['callback']), $hook['priority']);
			} else
				add_filter($hook['hook'], array($hook['component'], $hook['callback']), $hook['priority'], $hook['args']);
		}
 
		foreach ($this->actions as $hook) {
			add_action($hook['hook'], array($hook['component'], $hook['callback']));
		}
	} // run()

} // class ProspectLoader
