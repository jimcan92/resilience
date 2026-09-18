<script lang="ts">
	import { appStatus } from '$lib/states/status.svelte';
	import { AlertType } from '$lib/types';
	import type * as LType from 'leaflet';
	import { onDestroy, onMount } from 'svelte';

	let { latitude = $bindable(14.5995), longitude = $bindable(120.9842) } = $props();

	let mapContainer!: HTMLDivElement;
	let map: LType.Map | null = null;
	let marker: LType.Marker | null = null;
	let L: typeof LType | null = null;

	const googleSatellite = () =>
		L!.tileLayer('https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', {
			maxZoom: 21,
			attribution: '© Google'
		});

	const googleHybrid = () =>
		L!.tileLayer('https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', {
			maxZoom: 21,
			attribution: '© Google'
		});

	const streetsLayer = () =>
		L!.tileLayer('https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
			maxZoom: 21,
			attribution: '© Google'
		});

	onMount(async () => {
		L = await import('leaflet');
		await import('leaflet/dist/leaflet.css');

		delete (L.Icon.Default.prototype as any)._getIconUrl;
		L.Icon.Default.mergeOptions({
			iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
			iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
			shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png'
		});

		map = L.map(mapContainer, {
			center: [latitude, longitude],
			zoom: 15,
			zoomControl: true
		});

		googleSatellite().addTo(map);

		const baseMaps = {
			Satellite: googleSatellite(),
			Hybrid: googleHybrid(),
			Streets: streetsLayer()
		};

		L.control.layers(baseMaps, undefined, { position: 'topright' }).addTo(map);
		L.control.scale({ position: 'bottomleft', imperial: false }).addTo(map);

		marker = L.marker([latitude, longitude], {
			draggable: true,
			autoPan: true
		}).addTo(map);

		marker.bindPopup('Selected location').openPopup();

		marker.on('dragend', () => {
			if (!marker) return;
			const pos = marker.getLatLng();
			latitude = pos.lat;
			longitude = pos.lng;
		});

		map.on('click', (e: LType.LeafletMouseEvent) => {
			latitude = e.latlng.lat;
			longitude = e.latlng.lng;
			marker?.setLatLng([latitude, longitude]);
		});
	});

	onDestroy(() => {
		map?.remove();
		map = null;
		marker = null;
		L = null;
	});

	$effect(() => {
		if (marker && map) {
			const current = marker.getLatLng();

			if (Math.abs(current.lat - latitude) > 0.0001 || Math.abs(current.lng - longitude) > 0.0001) {
				marker.setLatLng([latitude, longitude]);
				map.setView([latitude, longitude], map.getZoom());
			}
		}
	});

	function useMyLocation() {
		if (!navigator.geolocation) {
			alert('Geolocation is not supported by your browser.');
			return;
		}

		navigator.geolocation.getCurrentPosition(
			(pos) => {
				latitude = pos.coords.latitude;
				longitude = pos.coords.longitude;
			},
			(err) => {
				alert(`Unable to get location: ${err.message}`);
			}
		);
	}

	function openHazardHunter() {
		const url = `https://hazardhunter.georisk.gov.ph/map?lat=${latitude}&lng=${longitude}`;
		window.open(url, '_blank', 'noopener');
	}

	function copyLatitude() {
		const text = latitude.toFixed(6);

		navigator.clipboard
			.writeText(text)
			.then(() => {
				// alert(`Latitude copied: ${text}`);
				// toastMessage = `Latitude copied: ${text}`;
				appStatus.addAlert({ type: AlertType.success, message: `Latitude copied: ${text}` });
			})
			.catch(() => {
				// alert(`Latitude: ${text}\n\nManually copy.`);
				// toastMessage = `Latitude: ${text}\n\nManually copy.`;
				appStatus.addAlert({
					type: AlertType.error,
					message: 'Error copying latitude to clipboard.'
				});
			});
	}

	function copyLongitude() {
		const text = longitude.toFixed(6);

		navigator.clipboard
			.writeText(text)
			.then(() => {
				// alert(`Longitude copied: ${text}`);
				appStatus.addAlert({ type: AlertType.success, message: `Longitude copied: ${text}` });
			})
			.catch(() => {
				// alert(`Longitude: ${text}\n\nManually copy.`);
				appStatus.addAlert({
					type: AlertType.error,
					message: 'Error copying longitude to clipboard.'
				});
			});
	}
</script>

<div class="space-y-3">
	<div class="flex flex-wrap items-center justify-between gap-2">
		<span class="label-text font-medium">Click on the map to set location</span>

		<button type="button" class="btn btn-outline btn-xs" onclick={useMyLocation}>
			Use my location
		</button>
	</div>

	<div
		bind:this={mapContainer}
		class="h-72 w-full rounded-lg border-2 border-base-300 shadow-lg sm:h-96"
	></div>

	<div class="font-data grid grid-cols-2 gap-2 text-xs">
		<button type="button" class="rounded bg-base-200 p-2 text-center" onclick={copyLatitude}>
			<span class="font-medium">Latitude:</span>
			{latitude.toFixed(6)}
		</button>

		<button type="button" class="rounded bg-base-200 p-2 text-center" onclick={copyLongitude}>
			<span class="font-medium">Longitude:</span>
			{longitude.toFixed(6)}
		</button>
	</div>

	<div class="alert text-xs alert-info">
		<svg
			xmlns="http://www.w3.org/2000/svg"
			fill="none"
			viewBox="0 0 24 24"
			class="h-4 w-4 shrink-0 stroke-current"
		>
			<path
				stroke-linecap="round"
				stroke-linejoin="round"
				stroke-width="2"
				d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
			></path>
		</svg>

		<span>
			<strong>How to get fault distance:</strong> Click "Open HazardHunterPH" → select "Seismic Hazard"
			→ "Ground Shaking" → copy the distance to nearest fault.
		</span>
	</div>
</div>

<style>
	:global(.leaflet-container) {
		z-index: 0;
		font-family: inherit;
		border-radius: 0.5rem;
	}

	:global(.leaflet-control-layers) {
		border-radius: 0.5rem;
		font-size: 0.85rem;
	}

	:global(.leaflet-popup-content) {
		font-size: 0.85rem;
		font-weight: 600;
	}
</style>
