# Re-renders frame 62 of out/shot_mula.blend with a chosen engine to compare speed.
import bpy, sys, time
argv = sys.argv[sys.argv.index('--') + 1:]
eng, samples, pct, out = argv[0], int(argv[1]), int(argv[2]), argv[3]
sc = bpy.context.scene
sc.render.resolution_percentage = pct
if eng == 'EEVEE':
    sc.render.engine = 'BLENDER_EEVEE_NEXT'
    e = sc.eevee; e.taa_render_samples = samples
    e.use_raytracing = True; e.ray_tracing_method = 'SCREEN'
    e.use_shadows = True; e.shadow_ray_count = 2; e.use_volumetric_shadows = False
    e.fast_gi_method = 'GLOBAL_ILLUMINATION'; e.use_fast_gi = True
else:
    sc.cycles.samples = samples
sc.frame_set(62); sc.render.filepath = out
t = time.time(); bpy.ops.render.render(write_still=True); print('RENDER_SECONDS', round(time.time() - t, 1))
