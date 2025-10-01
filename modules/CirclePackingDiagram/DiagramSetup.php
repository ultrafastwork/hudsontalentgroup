<?php

declare( strict_types=1 );

namespace Mapsteps\Htg\Module\CirclePackingDiagram;

class DiagramSetup
{
	public function __construct()
	{
		add_shortcode('hudson_amcharts_graph', [$this, 'render_amcharts_shortcode']);
		add_action('wp_enqueue_scripts', [$this, 'register_assets']);
	}

	public function register_assets()
	{
		// Core amCharts assets.
		wp_register_script('amcharts-core', 'https://cdn.amcharts.com/lib/5/index.js', [], null, true);
		wp_register_script('amcharts-hierarchy', 'https://cdn.amcharts.com/lib/5/hierarchy.js', ['amcharts-core'], null, true);
		wp_register_script('amcharts-animated', 'https://cdn.amcharts.com/lib/5/themes/Animated.js', ['amcharts-core'], null, true);
		wp_register_script('amcharts-responsive', 'https://cdn.amcharts.com/lib/5/themes/Responsive.js', ['amcharts-core'], null, true);

		// Internal script & style assets.
		wp_register_script('hudson-amcharts', HTG_PLUGIN_URL . '/modules/CirclePackingDiagram/assets/js/hudson-amcharts.js', ['amcharts-core', 'amcharts-hierarchy', 'amcharts-animated', 'amcharts-responsive'], HTG_PLUGIN_VERSION, true);
		wp_register_style('hudson-amcharts', HTG_PLUGIN_URL . '/modules/CirclePackingDiagram/assets/css/hudson-amcharts.css', [], HTG_PLUGIN_VERSION);
	}

	public function render_amcharts_shortcode($atts, $content = null)
	{
		$atts = shortcode_atts([
			'height' => '800',
		], $atts, 'hudson_amcharts_graph');

		wp_enqueue_script('hudson-amcharts');
		wp_enqueue_style('hudson-amcharts');

		$id = 'hudson-amcharts-' . wp_rand(1000, 9999);
		$height = intval($atts['height']);

		// If no content provided, use default data structure
		if (empty($content)) {
			$data = $this->get_default_data();
		} else {
			$data = trim($content);
		}

		ob_start();
		?>

		<div id="<?php echo esc_attr($id); ?>" class="hudson-amcharts-container" style="height: <?php echo esc_attr($height); ?>px"></div>
		<script type="application/json" id="<?php echo esc_attr($id); ?>-data"><?php echo wp_kses_post($data); ?></script>
		<script>
			document.addEventListener('DOMContentLoaded', function() {
				if (typeof window.hudsonAmchartsInit === 'function') {
					window.hudsonAmchartsInit('<?php echo esc_js($id); ?>');
				}
			});
		</script>

		<?php
		return ob_get_clean();
	}

	private function get_default_data()
	{
		// Load default data from JSON file
		$json_file = HTG_PLUGIN_DIR . '/modules/CirclePackingDiagram/assets/data/default-chart-data.json';

		if (!file_exists($json_file)) {
			error_log('Hudson amCharts: Default data file not found at ' . $json_file);
			return '{}';
		}

		$json_content = file_get_contents($json_file);

		if ($json_content === false) {
			error_log('Hudson amCharts: Failed to read default data file');
			return '{}';
		}

		// Validate JSON
		json_decode($json_content, true);
		if (json_last_error() !== JSON_ERROR_NONE) {
			error_log('Hudson amCharts: Invalid JSON in default data file - ' . json_last_error_msg());
			return '{}';
		}

		return $json_content;
	}
}
