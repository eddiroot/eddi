<!-- This breaks the parent layout chain and hides navigation elements -->
<style>
	/* Hide all navigation elements for presentation mode */
	:global([data-sidebar="sidebar"]) {
		display: none !important;
	}
	
	:global(header) {
		display: none !important;
	}
	
	:global(main) {
		height: 100vh !important;
		overflow: hidden !important;
		padding: 0 !important;
		margin: 0 !important;
	}
	
	:global(.sidebar-provider) {
		height: 100vh !important;
	}
	
	:global(body) {
		overflow: hidden !important;
	}
	
	/* Make sure the presentation takes the full screen */
	:global(.presentation-container) {
		position: fixed !important;
		top: 0 !important;
		left: 0 !important;
		width: 100vw !important;
		height: 100vh !important;
		z-index: 9999 !important;
	}
</style>

<slot />