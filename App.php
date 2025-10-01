<?php

declare( strict_types=1 );

namespace Mapsteps\Htg;

use Mapsteps\Htg\Modules\CirclePackingDiagram\DiagramSetup;

class App
{
	public const PLUGIN_FILE = 'legacyhome/legacyhome.php';

	public function __construct()
	{
		$this->setupConstants();
		add_action( 'plugins_loaded', [$this, 'setupModules'] );
	}

	/**
	 * Get the plugin version based on the main plugin file definition.
	 *
	 * @return string The plugin version or an empty string if not found.
	 */
	private function pluginVersion(): string
	{
		if ( ! function_exists( 'get_plugin_data' ) ) {
			require_once ABSPATH . 'wp-admin/includes/plugin.php';
		}

		$plugin_path = WP_PLUGIN_DIR . '/' . self::PLUGIN_FILE;

		if ( file_exists( $plugin_path ) ) {
			$plugin_data = get_plugin_data( $plugin_path );

			if ( isset( $plugin_data['Version'] ) ) {
				return $plugin_data['Version'];
			}
		}

		return '';
	}

	private function setupConstants(): void
	{
		if ( !defined( 'HTG_PLUGIN_DIR' ) ) {
			// phpcs:ignore ModernWpcsStandard.Constants.DisallowDefine.Define
			define( 'HTG_PLUGIN_DIR', rtrim( plugin_dir_path( __FILE__ ), '/' ) );
		}

		if ( !defined( 'HTG_PLUGIN_URL' ) ) {
			// phpcs:ignore ModernWpcsStandard.Constants.DisallowDefine.Define
			define( 'HTG_PLUGIN_URL', rtrim( plugin_dir_url( __FILE__ ), '/' ) );
		}
		
		if ( !defined( 'HTG_PLUGIN_VERSION' ) ) {
			// phpcs:ignore ModernWpcsStandard.Constants.DisallowDefine.Define
			define( 'HTG_PLUGIN_VERSION', self::pluginVersion() );
		}

		if ( !defined( 'HTG_PLUGIN_FILE' ) ) {
			// phpcs:ignore ModernWpcsStandard.Constants.DisallowDefine.Define
			define( 'HTG_PLUGIN_FILE', self::PLUGIN_FILE );
		}
	}

	public function setupModules(): void
	{
		new DiagramSetup();
	}
}
