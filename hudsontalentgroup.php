<?php

declare( strict_types = 1 );

require_once __DIR__ . '/vendor/autoload.php';

use Mapsteps\Htg\App;

/**
 * Plugin Name: Hudson Talent Group
 * Description: Internal WordPress plugin for Hudson Talent Group.
 * Version: 0.1.0
 * Author: Hudson Talent Group
 */


if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

new App();
