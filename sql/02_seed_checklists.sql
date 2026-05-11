-- =====================================================================
-- AROET Checklist Templates Seed
-- 6 templates from official A&R Belgium PDFs
-- Run after 01_migration.sql
-- =====================================================================

-- Clean reseed (idempotent)
delete from checklist_items where section_id in (select id from checklist_sections);
delete from checklist_sections where template_id in (select id from checklist_templates);
delete from checklist_templates;

do $$
declare
  v_template_id bigint;
  v_section_id bigint;
begin

  -- DLM (29 items)
  insert into checklist_templates (machine_type, version, name, source, is_active)
  values ('DLM', null, '46-ARCARR LensMapper DLM', 'A&R Official', true)
  returning id into v_template_id;

  insert into checklist_sections (template_id, section_no, title, display_order)
  values (v_template_id, '1', 'General', 1)
  returning id into v_section_id;

  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '1.1', 'General cleaning', 1);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '1.2', 'Exchange fan filter', 2);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '1.3', 'Check backplane voltages', 3);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '1.4', 'Check motherboard fan', 4);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '1.5', 'Check convex lens holder fingers sleeves', 5);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '1.6', 'Check drawer', 6);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '1.7', 'Check drawer touch bouton', 7);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '1.8', 'Check convex lens holder position in AR mode', 8);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '1.9', 'Dimension calibration', 9);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '2.0', 'Reflection calibration', 10);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '2.1', 'Transmission calibration', 11);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '2.2', 'Run all checks to control correct operation', 12);

  insert into checklist_sections (template_id, section_no, title, display_order)
  values (v_template_id, '2', 'LensMapper', 2)
  returning id into v_section_id;

  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '2.1', 'Control the cleanliness of the LCD glass', 1);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '2.2', 'Control the brightness of the screen LVDS', 2);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '2.3', 'Control of the mirror condition', 3);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '2.4', 'Control motor diaphragm condition', 4);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '2.5', 'Measurment without lens', 5);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '2.6', 'Check LED matrix', 6);

  insert into checklist_sections (template_id, section_no, title, display_order)
  values (v_template_id, '3', 'Concave holder (option)', 3)
  returning id into v_section_id;

  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '3.1', 'Check concave lens holder fingers sleeves', 1);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '3.2', 'Check concave lens holder position', 2);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '3.3', 'Reflection calibration', 3);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '3.4', 'Transmission calibration', 4);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '3.5', 'Run all chels to control correct operation', 5);

  insert into checklist_sections (template_id, section_no, title, display_order)
  values (v_template_id, '4', 'Edged lens holder (option)', 4)
  returning id into v_section_id;

  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '4.1', 'Check state of the edged lens holder gripper fingers', 1);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '4.2', 'Check general state of the edged lens holder gripper', 2);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '4.3', 'Check edged lens holder position', 3);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '4.4', 'Reflection calibration', 4);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '4.5', 'Transmission calibration', 5);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '4.6', 'Run all checks to control correct operation', 6);


  -- MCVP4 (88 items)
  insert into checklist_templates (machine_type, version, name, source, is_active)
  values ('MCVP4', null, 'F2 MCVP4 AutoMapper', 'A&R Official', true)
  returning id into v_template_id;

  insert into checklist_sections (template_id, section_no, title, display_order)
  values (v_template_id, '1', 'Loading station', 1)
  returning id into v_section_id;

  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '1.1', 'Exchange of the suction cups caps', 1);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '1.2', 'Exchange of suction cups', 2);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '1.3', 'Control of the height locking cylinder', 3);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '1.4', 'Control stops and shock absorber', 4);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '1.5', 'Control of the chain cable carrier cable', 5);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '1.6', 'Control the cylinders play and axes cleaning', 6);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '1.7', 'Control of suction cup telescopic', 7);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '1.8', 'Control and cleaning filters venturi', 8);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '1.9', 'Exchange of the 5 one way valves', 9);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '1.10', 'Exchange of the 5 rubber fingers of the centering gripper', 10);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '1.11', 'Control of the belt', 11);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '1.12', 'Control of the fingers grippers bearings', 12);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '1.13', 'Control of the vibration device', 13);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '1.14', 'Control of pressure regulators for gripper centering', 14);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '1.15', 'Control the condition of the loading platform', 15);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '1.16', 'Control of the X-Y position and rotation of the platform', 16);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '1.17', 'Control of the complete loading sequence', 17);

  insert into checklist_sections (template_id, section_no, title, display_order)
  values (v_template_id, '2', 'Turntable', 2)
  returning id into v_section_id;

  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '2.1', '.Control of the belt tension', 1);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '2.2', '.Control of the gap of the indexing table', 2);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '2.3', 'Control of grippers general condition', 3);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '2.4', 'Control of the fingers rotation', 4);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '2.5', 'Control of grippers opening', 5);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '2.6', 'Control of gripper support bearings', 6);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '2.7', 'Control of the grippers brakes', 7);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '2.8', 'Control of the electrovalves', 8);

  insert into checklist_sections (template_id, section_no, title, display_order)
  values (v_template_id, '3', 'PPOS', 3)
  returning id into v_section_id;

  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '3.1', 'Control the cleanliness of the LCD glass', 1);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '3.2', 'Control LCD hight and level', 2);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '3.3', 'Control LVD position according to the camera', 3);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '3.4', 'Control of the LCD polar filter condition', 4);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '3.5', 'Control the brightness of the screen LVDS', 5);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '3.6', 'Control of the condition and clealiness of the field lens', 6);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '3.7', 'Control of the polar option', 7);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '3.8', 'Control of the condition and clealiness of the additionnal lens', 8);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '3.9', 'Control of the focus camera', 9);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '3.10', 'Control motor diaphragm condition', 10);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '3.11', 'Control of the couplings', 11);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '3.12', 'Control of the X,Y tables', 12);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '3.13', 'Control of the shaft wear condition', 13);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '3.14', 'Control of the shaft tightening', 14);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '3.15', 'Control of the motor cables', 15);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '3.16', 'Control of the pression regulator', 16);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '3.17', 'Control the cylinders play and axes cleaning', 17);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '3.18', 'Calibration of the motor diaphragm aperture', 18);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '3.19', 'Brightness calibration', 19);

  insert into checklist_sections (template_id, section_no, title, display_order)
  values (v_template_id, '4', 'General', 4)
  returning id into v_section_id;

  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '4.1', 'Control push buttons and indicator lamps', 1);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '4.2', 'Control lamp voltage presence', 2);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '4.3', 'Control of the light tower', 3);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '4.4', 'Control of doors detectors', 4);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '4.5', 'Control the fans and filters', 5);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '4.6', 'Control of the filter and speed of the filter group', 6);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '4.7', 'General cleaning of the machines', 7);

  insert into checklist_sections (template_id, section_no, title, display_order)
  values (v_template_id, '5', 'TLS', 5)
  returning id into v_section_id;

  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '5.1', 'Control of cleanliness of the heads of the lenses', 1);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '5.2', 'Control the alignment of the heads', 2);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '5.3', '.Control of homing height', 3);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '5.4', 'Control signal interference', 4);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '5.5', 'Control signals in general', 5);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '5.6', 'Test of the 1000 mesures', 6);

  insert into checklist_sections (template_id, section_no, title, display_order)
  values (v_template_id, '6', 'Computer cabinet', 6)
  returning id into v_section_id;

  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '6.1', 'Cleaning the PC filters and the frame', 1);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '6.2', 'Control UPS battery', 2);

  insert into checklist_sections (template_id, section_no, title, display_order)
  values (v_template_id, '7', 'DLM', 7)
  returning id into v_section_id;

  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '7.1', 'Control the cleanliness of the LCD glass', 1);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '7.2', 'Control the brightness of the screen LVDS', 2);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '7.3', 'Control of the mirror condition', 3);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '7.4', 'Control motor diaphragm condition', 4);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '7.5', 'Measurment without lens', 5);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '7.6', 'Check LED matrix', 6);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '7.7', 'Check DLM after calibration', 7);

  insert into checklist_sections (template_id, section_no, title, display_order)
  values (v_template_id, '8', 'Unloading', 8)
  returning id into v_section_id;

  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '8.1', 'Exchange of suction cup cap', 1);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '8.2', 'Exchange suction cap', 2);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '8.3', 'Control of the chain cable carrier cable', 3);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '8.4', 'For V1: control of the cylinders play and axes cleaning', 4);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '8.5', 'For V2: control of the belt of the electric cylinder', 5);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '8.6', 'Control of suction cup telescopic', 6);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '8.7', 'Control and cleaning of venturi filters', 7);

  insert into checklist_sections (template_id, section_no, title, display_order)
  values (v_template_id, '9', 'Reset station', 9)
  returning id into v_section_id;

  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '9.1', 'Control of the state of shaft wear', 1);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '9.2', 'Control of the conec condition', 2);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '9.3', 'Control of the shaft tightening', 3);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '9.4', 'Control of the motor cables', 4);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '9.5', 'Control of the pression regulator', 5);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '9.6', 'Control of the cylinder play', 6);

  insert into checklist_sections (template_id, section_no, title, display_order)
  values (v_template_id, '10', 'Conveyor', 10)
  returning id into v_section_id;

  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '10.1', 'Control of the chain', 1);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '10.2', 'Control the pad brake cylinder', 2);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '10.3', 'Control bar code reader', 3);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '10.4', 'Control of the stop tray', 4);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '10.5', 'Control of detectors and reflector', 5);

  insert into checklist_sections (template_id, section_no, title, display_order)
  values (v_template_id, '11', 'Reject printer', 11)
  returning id into v_section_id;

  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '11.1', 'Cleaninif device', 1);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '11.2', 'Control state of the printer head', 2);

  insert into checklist_sections (template_id, section_no, title, display_order)
  values (v_template_id, '12', 'Calibration and backup', 12)
  returning id into v_section_id;

  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '12.1', 'Complete calibration sequence', 1);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '12.2', 'Backup of every vision system and machine folder after calibration', 2);


  -- MCVP8 V1 (120 items)
  insert into checklist_templates (machine_type, version, name, source, is_active)
  values ('MCVP8', 'V1', '11'' MCVP8 Control Unit V1', 'A&R Official', true)
  returning id into v_template_id;

  insert into checklist_sections (template_id, section_no, title, display_order)
  values (v_template_id, '1', 'Loading station', 1)
  returning id into v_section_id;

  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '1.1', 'Exchange of the suction cups caps', 1);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '1.2', 'Control of the téléscopic cylinder', 2);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '1.3', 'Control of the play of the téléscopic cylinder', 3);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '1.4', 'Control stops and shock absorber', 4);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '1.5', 'Control of the chain cable carrier cable', 5);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '1.6', 'Control the rubber covering on the loading platform', 6);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '1.7', 'contrôle of the gripper and dampers', 7);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '1.8', 'cleaning the vacum filter of venturi and tubing', 8);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '1.9', 'Calibration of the diameter measurement device', 9);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '1.10', 'Control of the diameter gripper', 10);

  insert into checklist_sections (template_id, section_no, title, display_order)
  values (v_template_id, '2', 'Turntable', 2)
  returning id into v_section_id;

  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '2.1', 'Contrôle of the brake pressure and the bake membranes', 1);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '2.2', 'Control of the gripper and refurbishement according part availability', 2);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '2.3', 'Lubrification of the carrier', 3);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '2.4', 'Control of the cone', 4);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '2.5', 'Control of cannele', 5);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '2.6', 'Control of the cone and the shaft correspondance', 6);

  insert into checklist_sections (template_id, section_no, title, display_order)
  values (v_template_id, '3', 'PPOS', 3)
  returning id into v_section_id;

  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '3.1', 'Control the cleanliness of the LCD glass', 1);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '3.2', 'Control LCD hight and level', 2);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '3.3', 'Control LCD position according to the camera', 3);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '3.4', 'Control of the LCD polar filter condition', 4);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '3.5', 'Control the brightness of the screen LVDS', 5);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '3.6', 'Control of the condition and clealiness of the field lens', 6);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '3.7', 'Control of the polar option', 7);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '3.8', 'Control of the condition and clealiness of the additionnal lens', 8);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '3.9', 'Control of the focus camera', 9);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '3.10', 'Control motor diaphragm condition', 10);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '3.11', 'Control of the couplings', 11);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '3.12', 'Control of the X,Y tables', 12);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '3.13', 'Control of the shaft wear condition', 13);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '3.14', 'Control of the shaft tightening', 14);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '3.15', 'Control of the motor cables', 15);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '3.16', 'Control of the pression regulator', 16);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '3.17', 'Control the cylinders play and axes cleaning', 17);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '3.18', 'Calibration of the motor diaphragm aperture', 18);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '3.19', 'Brightness calibration', 19);

  insert into checklist_sections (template_id, section_no, title, display_order)
  values (v_template_id, '4', 'General', 4)
  returning id into v_section_id;

  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '4.1', 'Control push buttons and indicator lamps', 1);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '4.2', 'Control lamp voltage presence', 2);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '4.3', 'Control of the light tower', 3);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '4.4', 'Control of security', 4);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '4.5', 'Control the fans and filters', 5);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '4.6', 'Control of the filter and speed of the filter group', 6);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '4.7', 'General cleaning of the machines', 7);

  insert into checklist_sections (template_id, section_no, title, display_order)
  values (v_template_id, '5', 'TLS', 5)
  returning id into v_section_id;

  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '5.1', 'Control of cleanliness of the heads of the lenses', 1);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '5.2', 'Control the alignment of the heads', 2);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '5.3', 'Control of homing height', 3);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '5.4', 'Control signal interference', 4);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '5.5', 'Control signals in general', 5);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '5.6', 'Test of the 1000 mesures', 6);

  insert into checklist_sections (template_id, section_no, title, display_order)
  values (v_template_id, '6', 'Computer cabinet', 6)
  returning id into v_section_id;

  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '6.1', 'Cleaning the PC filters and the frame', 1);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '6.2', 'Clean / change the filter for vision computers (rack)', 2);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '6.2', 'Control UPS battery', 3);

  insert into checklist_sections (template_id, section_no, title, display_order)
  values (v_template_id, '7', 'DLM', 7)
  returning id into v_section_id;

  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '7.1', 'Control the cleanliness of the LCD glass', 1);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '7.2', 'Control the brightness of the screen LVDS', 2);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '7.3', 'Control of the mirror condition', 3);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '7.4', 'Control motor diaphragm condition', 4);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '7.5', 'Measurment without lens', 5);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '7.6', 'Check LED matrix', 6);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '7.7', 'Check DLM after calibration', 7);

  insert into checklist_sections (template_id, section_no, title, display_order)
  values (v_template_id, '8', 'Focovision mobile', 8)
  returning id into v_section_id;

  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '8.1', 'Control of the shaft wear condition', 1);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '8.2', 'Control of the shaft tightening', 2);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '8.3', 'Control of the motor cables', 3);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '8.4', 'Control of the pression regulator', 4);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '8.5', 'Control the cylinders play and axes cleaning', 5);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '8.6', 'Control of the additional prisme', 6);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '8.7', 'Control of the couplings', 7);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '8.9', 'Control of the X, Y tables', 8);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '8.10', 'Control the ball screw of the fixe axes', 9);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '8.11', 'Control of the truck and guide Star', 10);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '8.12', 'Exchange the protective glass and the depositing ring', 11);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '8.13', 'Exchange the bulb', 12);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '8.14', 'Control of the optical alignment', 13);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '8.15', 'Focovision calibration', 14);

  insert into checklist_sections (template_id, section_no, title, display_order)
  values (v_template_id, '9', 'Spectrometer', 9)
  returning id into v_section_id;

  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '9.1', 'Control of the rotary switch for transmition and reflection', 1);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '9.2', 'Cleaning of the optic', 2);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '9.3', 'Control of the lamps and cleaning of the reflectors', 3);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '9.4', 'Control of the UV led', 4);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '9.5', 'Control Bright and dark calibration', 5);

  insert into checklist_sections (template_id, section_no, title, display_order)
  values (v_template_id, '11', 'Printing control', 10)
  returning id into v_section_id;

  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '11.1', 'Control the cleanliness of the LCD glass', 1);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '11.2', 'Control LCD hight and level', 2);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '11.3', 'Control LVD position according to the camera', 3);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '11.4', 'Control of the LCD polar filter condition', 4);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '11.5', 'Control the brightness of the screen LVDS', 5);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '11.6', 'Control of the condition and clealiness of the field lens', 6);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '11.7', 'Control of the focus camera', 7);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '11.8', 'Control motor diaphragm condition', 8);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '11.9', 'Calibration of the aperture motor diaphragm', 9);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '11.10', 'Brightness calibration', 10);

  insert into checklist_sections (template_id, section_no, title, display_order)
  values (v_template_id, '12', 'Unloading', 11)
  returning id into v_section_id;

  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '12.1', 'Exchange of suction cup cap', 1);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '12.2', 'Exchange suction cup', 2);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '12.3', 'Control of the chain cable carrier cable', 3);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '12.4', 'For V1: control of the cylinders play and axes cleaning', 4);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '12.5', 'For V2: control of the belt of the electric cylinder', 5);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '12.6', 'Control of suction cup telescopic', 6);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '12.7', 'Control and cleaning of venturi filters', 7);

  insert into checklist_sections (template_id, section_no, title, display_order)
  values (v_template_id, '13', 'Reset station', 12)
  returning id into v_section_id;

  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '13.1', 'Control of the state of shaft wear', 1);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '13.2', 'Control of the cone condition', 2);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '13.3', 'Control of the shaft tightening', 3);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '13.4', 'Control of the motor cables', 4);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '13.5', 'Control of the pression regulator', 5);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '13.6', 'Control of the cylinder play', 6);

  insert into checklist_sections (template_id, section_no, title, display_order)
  values (v_template_id, '14', 'Conveyor', 13)
  returning id into v_section_id;

  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '14.1', 'Control of the chain', 1);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '14.2', 'Control and clean the bar code reader', 2);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '14.3', 'Control of the stop tray', 3);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '14.4', 'Control of detectors and reflector', 4);

  insert into checklist_sections (template_id, section_no, title, display_order)
  values (v_template_id, '15', 'Horizontal accumulator', 14)
  returning id into v_section_id;

  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '15.1', 'Control of all shoch absorber', 1);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '15.2', 'contrôle of the condition of the pusher and guiding plates', 2);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '15.3', 'Cleaning of the platfroms and adjustment if required', 3);

  insert into checklist_sections (template_id, section_no, title, display_order)
  values (v_template_id, '16', 'Reject printer', 15)
  returning id into v_section_id;

  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '16.1', 'Cleaninif device', 1);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '16.2', 'Control state of the printer head', 2);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '17.1', 'Control of the state of the UV lamp', 3);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '17.2', 'Check 0° Inclinaison', 4);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '18.1', 'Control the robot belt', 5);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '18.2', 'remplace the battery', 6);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '18.3', 'Grease the harmonic drives if necessary', 7);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '18.4', 'Control of all air tubes and cables', 8);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '19.1', 'Control of the smoothness of the pistont', 9);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '19.2', 'Control tightness of screws of motor couplings', 10);

  insert into checklist_sections (template_id, section_no, title, display_order)
  values (v_template_id, '20', 'Calibration and backup', 16)
  returning id into v_section_id;

  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '20.1', 'Check the shaft alignments', 1);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '20.2', 'Control of station-to-station alignment (CALI30)', 2);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '20.10', 'Backup of every vision system and machine folder after calibration', 3);


  -- MCVP8 V2 (134 items)
  insert into checklist_templates (machine_type, version, name, source, is_active)
  values ('MCVP8', 'V2', '11 MCVP8 Control Unit V2', 'A&R Official', true)
  returning id into v_template_id;

  insert into checklist_sections (template_id, section_no, title, display_order)
  values (v_template_id, '1', 'Loading station', 1)
  returning id into v_section_id;

  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '1.1', 'Exchange of the suction cups caps', 1);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '1.2', 'Exchange of suction cups', 2);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '1.3', 'Control of the height locking cylinder', 3);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '1.4', 'Control stops and shock absorber', 4);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '1.5', 'Control of the chain cable carrier cable', 5);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '1.6', 'Control the cylinders play and axes cleaning', 6);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '1.7', 'Control of suction cup telescopic', 7);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '1.8', 'Control and cleaning filters venturi', 8);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '1.9', 'Exchange of the 5 one way valves', 9);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '1.10', 'Exchange of the 5 rubber fingers of the centering gripper', 10);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '1.11', 'Control of the belt', 11);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '1.12', 'Control of the fingers grippers bearings', 12);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '1.13', 'Control of the vibration device', 13);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '1.14', 'Control of pressure regulators for gripper centering', 14);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '1.15', 'Control the condition of the loading platform', 15);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '1.16', 'Control of the X-Y position and rotation of the platform', 16);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '1.17', 'Control of the complete loading sequence', 17);

  insert into checklist_sections (template_id, section_no, title, display_order)
  values (v_template_id, '2', 'Turntable', 2)
  returning id into v_section_id;

  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '2.1', 'Control of the belt tension', 1);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '2.2', 'Control of the gap of the indexing table', 2);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '2.3', 'Control of grippers general condition', 3);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '2.4', 'Control of the fingers rotation', 4);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '2.5', 'Control of grippers opening', 5);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '2.6', 'Control of gripper support bearings', 6);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '2.7', 'Control of the grippers brakes', 7);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '2.8', 'Control of the electrovalves', 8);

  insert into checklist_sections (template_id, section_no, title, display_order)
  values (v_template_id, '3', 'PPOS', 3)
  returning id into v_section_id;

  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '3.1', 'Control the cleanliness of the LCD glass', 1);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '3.2', 'Control LCD hight and level', 2);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '3.3', 'Control LCD position according to the camera', 3);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '3.4', 'Control of the LCD polar filter condition', 4);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '3.5', 'Control the brightness of the screen LVDS', 5);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '3.6', 'Control of the condition and clealiness of the field lens', 6);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '3.7', 'Control of the polar option', 7);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '3.8', 'Control of the condition and clealiness of the additionnal lens', 8);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '3.9', 'Control of the focus camera', 9);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '3.10', 'Control motor diaphragm condition', 10);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '3.11', 'Control of the couplings', 11);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '3.12', 'Control of the X,Y tables', 12);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '3.13', 'Control of the shaft wear condition', 13);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '3.14', 'Control of the shaft tightening', 14);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '3.15', 'Control of the motor cables', 15);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '3.16', 'Control of the pression regulator', 16);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '3.17', 'Control the cylinders play and axes cleaning', 17);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '3.18', 'Calibration of the motor diaphragm aperture', 18);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '3.19', 'Brightness calibration', 19);

  insert into checklist_sections (template_id, section_no, title, display_order)
  values (v_template_id, '4', 'General', 4)
  returning id into v_section_id;

  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '4.1', 'Control push buttons and indicator lamps', 1);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '4.2', 'Control lamp voltage presence', 2);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '4.3', 'Control of the light tower', 3);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '4.4', 'Control of doors detectors', 4);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '4.5', 'Control the fans and filters', 5);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '4.6', 'Control of the filter and speed of the filter group', 6);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '4.7', 'General cleaning of the machines', 7);

  insert into checklist_sections (template_id, section_no, title, display_order)
  values (v_template_id, '5', 'TLS', 5)
  returning id into v_section_id;

  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '5.1', 'Control of cleanliness of the heads of the lenses', 1);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '5.2', 'Control the alignment of the heads', 2);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '5.3', 'Control of homing height', 3);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '5.4', 'Control signal interference', 4);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '5.5', 'Control signals in general', 5);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '5.6', 'Test of the 1000 mesures', 6);

  insert into checklist_sections (template_id, section_no, title, display_order)
  values (v_template_id, '6', 'Computer cabinet', 6)
  returning id into v_section_id;

  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '6.1', 'Cleaning the PC filters and the frame', 1);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '6.2', 'Control UPS battery', 2);

  insert into checklist_sections (template_id, section_no, title, display_order)
  values (v_template_id, '7', 'DLM', 7)
  returning id into v_section_id;

  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '7.1', 'Control the cleanliness of the LCD glass', 1);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '7.2', 'Control the brightness of the screen LVDS', 2);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '7.3', 'Control of the mirror condition', 3);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '7.4', 'Control motor diaphragm condition', 4);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '7.5', 'Measurment without lens', 5);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '7.6', 'Check LED matrix', 6);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '7.7', 'Check DLM after calibration', 7);

  insert into checklist_sections (template_id, section_no, title, display_order)
  values (v_template_id, '8', 'Focovision mobile', 8)
  returning id into v_section_id;

  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '8.1', 'Control of the shaft wear condition', 1);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '8.2', 'Control of the shaft tightening', 2);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '8.3', 'Control of the motor cables', 3);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '8.4', 'Control of the pression regulator', 4);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '8.5', 'Control the cylinders play and axes cleaning', 5);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '8.6', 'Control of the additional prisme', 6);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '8.7', 'Control of the couplings', 7);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '8.9', 'Control of the X, Y tables', 8);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '8.10', 'Control the ball screw of the fixe axes', 9);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '8.11', 'Control of the truck and guide Star', 10);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '8.12', 'Exchange the protective glass and the depositing ring', 11);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '8.13', 'Exchange the bulb', 12);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '8.14', 'Control of the optical alignment', 13);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '8.15', 'Focovision calibration', 14);

  insert into checklist_sections (template_id, section_no, title, display_order)
  values (v_template_id, '9', 'Spectrometer', 9)
  returning id into v_section_id;

  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '9.1', 'Control of the rotary switch for transmition and reflection', 1);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '9.2', 'Cleaning of the optic', 2);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '9.3', 'Control of the lamps and cleaning of the reflectors', 3);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '9.4', 'Control of the UV led', 4);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '9.5', 'Control Bright and dark calibration', 5);

  insert into checklist_sections (template_id, section_no, title, display_order)
  values (v_template_id, '10', 'Inkjet-Wax', 10)
  returning id into v_section_id;

  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '10.1', 'Open all Inking module covers', 1);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '10.2', 'removingÊdustÊwithÊaÊvacuumÊcleaner, cleaning with a suitable product and cloth', 2);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '10.3', 'Clean the covers', 3);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '10.4', 'Oil the linear bearing', 4);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '10.5', 'Check cleannes of whole system', 5);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '10.6', 'Wiper assembly Exchange', 6);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '10.7', 'Remove the solidified ink from the bin', 7);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '10.8', 'Inlet filter assembly exchange', 8);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '10.9', 'Pump filter exchange', 9);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '10.10', 'Tubing pump exchange', 10);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '10.11', 'Check the status and clean the pump assembly', 11);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '10.12', 'Check the status (visual) of Flat cable. exchange if the flat seems damaged', 12);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '10.13', 'Check the cleaness of the head', 13);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '10.14', 'Check the head cleaning sequence', 14);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '10.15', 'Check axis alignement', 15);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '10.16', 'Check and ajust double layout', 16);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '10.17', 'Check inking quality', 17);

  insert into checklist_sections (template_id, section_no, title, display_order)
  values (v_template_id, '11', 'Printing control', 11)
  returning id into v_section_id;

  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '11.1', 'Control the cleanliness of the LCD glass', 1);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '11.2', 'Control LCD hight and level', 2);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '11.3', 'Control LVD position according to the camera', 3);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '11.4', 'Control of the LCD polar filter condition', 4);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '11.5', 'Control the brightness of the screen LVDS', 5);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '11.6', 'Control of the condition and clealiness of the field lens', 6);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '11.7', 'Control of the focus camera', 7);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '11.8', 'Control motor diaphragm condition', 8);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '11.9', 'Calibration of the aperture motor diaphragm', 9);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '11.10', 'Brightness calibration', 10);

  insert into checklist_sections (template_id, section_no, title, display_order)
  values (v_template_id, '12', 'Unloading', 12)
  returning id into v_section_id;

  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '12.1', 'Exchange of suction cup cap', 1);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '12.2', 'Exchange suction caup', 2);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '12.3', 'Control of the chain cable carrier cable', 3);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '12.4', 'For V1: control of the cylinders play and axes cleaning', 4);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '12.5', 'For V2: control of the belt of the electric cylinder', 5);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '12.6', 'Control of suction cup telescopic', 6);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '12.7', 'Control and cleaning of venturi filters', 7);

  insert into checklist_sections (template_id, section_no, title, display_order)
  values (v_template_id, '13', 'Reset station', 13)
  returning id into v_section_id;

  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '13.1', 'Control of the state of shaft wear', 1);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '13.2', 'Control of the conec condition', 2);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '13.3', 'Control of the shaft tightening', 3);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '13.4', 'Control of the motor cables', 4);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '13.5', 'Control of the pression regulator', 5);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '13.6', 'Control of the cylinder play', 6);

  insert into checklist_sections (template_id, section_no, title, display_order)
  values (v_template_id, '14', 'Conveyor', 14)
  returning id into v_section_id;

  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '14.1', 'Control of the chain', 1);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '14.2', 'Control the pad brake cylinder', 2);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '14.3', 'Control bar code reader', 3);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '14.4', 'Control of the stop tray', 4);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '14.5', 'Control of detectors and reflector', 5);

  insert into checklist_sections (template_id, section_no, title, display_order)
  values (v_template_id, '15', 'Reject printer', 15)
  returning id into v_section_id;

  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '15.1', 'Cleaninif device', 1);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '15.2', 'Control state of the printer head', 2);

  insert into checklist_sections (template_id, section_no, title, display_order)
  values (v_template_id, '16', 'Calibration and backup', 16)
  returning id into v_section_id;

  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '16.1', 'Complete calibration sequence', 1);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '16.2', 'Backup of every vision system and machine folder after calibration', 2);


  -- SPV2 (45 items)
  insert into checklist_templates (machine_type, version, name, source, is_active)
  values ('SPV2', null, 'H1 ARFOCV Focovision SPV2', 'A&R Official', true)
  returning id into v_template_id;

  insert into checklist_sections (template_id, section_no, title, display_order)
  values (v_template_id, '1', 'General', 1)
  returning id into v_section_id;

  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '1.1', 'General cleaning', 1);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '1.2', 'Exchange fan filter', 2);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '1.4', 'Check backplane voltages', 3);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '1.5', 'Check motherboard fan and the compensator drive fans', 4);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '1.6', 'Check the communication of the printer and the thickness measurment', 5);

  insert into checklist_sections (template_id, section_no, title, display_order)
  values (v_template_id, '2', 'Focovision', 2)
  returning id into v_section_id;

  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '2.1', 'General cleaning', 1);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '2.2', 'Exchange the bulb', 2);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '2.3', 'Check bulb voltage', 3);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '2.4', 'Clean the E-line or D-line filter and the prism', 4);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '2.5', 'Exchange the protection glass', 5);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '2.6', 'Exchange the lens holder ring', 6);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '2.7', 'Open prism compensator, clean and check bearings', 7);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '2.8', 'Check prism compensator belts', 8);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '2.9', 'Check motor hears tightness', 9);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '3.0', 'Check motor connections', 10);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '3.1', 'Check motor belts tension', 11);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '3.2', 'Check Focovision optical alignment', 12);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '3.3', 'Diopter calibration', 13);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '3.4', 'Prism calibration', 14);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '3.5', 'Prism compensator test', 15);

  insert into checklist_sections (template_id, section_no, title, display_order)
  values (v_template_id, '3', 'Visualization', 3)
  returning id into v_section_id;

  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '3.1', 'General cleaning', 1);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '3.2', 'Check and clean beam splitter', 2);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '3.3', 'Check visualization camera position', 3);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '3.4', 'Clear visualization camera protection glass', 4);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '3.5', 'Check visualization camera focus', 5);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '3.6', 'Check differents holders of visualization', 6);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '3.7', 'Check LED''s and fibers for the visualization', 7);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '3.8', 'Dimension calibration', 8);

  insert into checklist_sections (template_id, section_no, title, display_order)
  values (v_template_id, '4', 'Marking (option)', 4)
  returning id into v_section_id;

  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '4.1', 'General cleaning', 1);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '4.2', 'Check marking device general state', 2);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '4.3', 'Rail clean and lubrication', 3);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '4.4', 'Check marking position according dimension calibration', 4);

  insert into checklist_sections (template_id, section_no, title, display_order)
  values (v_template_id, '5', 'Vacuum (option)', 5)
  returning id into v_section_id;

  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '5.1', 'General cleaning', 1);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '5.2', 'Exchange vacuum sleeve', 2);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '5.3', 'Check and cleaning vacuum tubing', 3);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '5.4', 'Check sealing ring', 4);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '5.5', 'Clean vacuum metal tube', 5);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '5.6', 'Check vacuum on different lens curvatures', 6);

  insert into checklist_sections (template_id, section_no, title, display_order)
  values (v_template_id, '6', 'Centring gripper (option)', 6)
  returning id into v_section_id;

  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '6.1', 'General cleaning', 1);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '6.2', 'Check gripper device general state', 2);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '6.3', 'Check the bearings play', 3);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '6.4', 'Rail clean and lubrication', 4);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '6.5', 'Exchange the gripper fingers', 5);

  insert into checklist_sections (template_id, section_no, title, display_order)
  values (v_template_id, '7', 'Polarisation (option)', 7)
  returning id into v_section_id;

  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '7.1', 'General cleaning', 1);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '7.2', 'Check the ajdustment', 2);


  -- SPV3 (44 items)
  insert into checklist_templates (machine_type, version, name, source, is_active)
  values ('SPV3', null, 'H1 ARFOCV Focovision SPV3', 'A&R Official', true)
  returning id into v_template_id;

  insert into checklist_sections (template_id, section_no, title, display_order)
  values (v_template_id, '1', 'General', 1)
  returning id into v_section_id;

  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '1.1', 'General cleaning', 1);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '1.2', 'Exchange fan filter', 2);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '1.4', 'Check backplane voltages', 3);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '1.5', 'Check motherboard fan and the compensator drive fans', 4);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '1.6', 'Check the communication of the printer and the thickness measurment', 5);

  insert into checklist_sections (template_id, section_no, title, display_order)
  values (v_template_id, '2', 'Focovision', 2)
  returning id into v_section_id;

  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '2.1', 'General cleaning', 1);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '2.2', 'Check LED current', 2);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '2.3', 'Clean the E-line or D-line filter and the prism', 3);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '2.4', 'Exchange the protection glass', 4);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '2.5', 'Exchange the lens holder ring', 5);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '2.6', 'Open prism compensator, clean and check bearings', 6);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '2.7', 'Check prism compensator belts', 7);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '2.8', 'Check motor hears tightness', 8);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '2.9', 'Check motor connections', 9);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '2.10', 'Check motor belts tension', 10);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '2.11', 'Check Focovision optical alignment', 11);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '2.12', 'Diopter calibration', 12);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '2.13', 'Prism calibration', 13);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '2.14', 'Prism compensator test', 14);

  insert into checklist_sections (template_id, section_no, title, display_order)
  values (v_template_id, '3', 'Visualization', 3)
  returning id into v_section_id;

  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '3.1', 'General cleaning', 1);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '3.2', 'Check and clean beam splitter', 2);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '3.3', 'Check visualization camera position', 3);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '3.4', 'Clear visualization camera protection glass', 4);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '3.5', 'Check visualization camera focus', 5);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '3.6', 'Check differents holders of visualization', 6);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '3.7', 'Check LED''s and fibers for the visualization', 7);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '3.8', 'Dimension calibration', 8);

  insert into checklist_sections (template_id, section_no, title, display_order)
  values (v_template_id, '4', 'Marking (option)', 4)
  returning id into v_section_id;

  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '4.1', 'General cleaning', 1);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '4.2', 'Check marking device general state', 2);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '4.3', 'Rail clean and lubrication', 3);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '4.4', 'Check marking position according dimension calibration', 4);

  insert into checklist_sections (template_id, section_no, title, display_order)
  values (v_template_id, '5', 'Vacuum (option)', 5)
  returning id into v_section_id;

  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '5.1', 'General cleaning', 1);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '5.2', 'Exchange vacuum sleeve', 2);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '5.3', 'Check and cleaning vacuum tubing', 3);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '5.4', 'Check sealing ring', 4);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '5.5', 'Clean vacuum metal tube', 5);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '5.6', 'Check vacuum on different lens curvatures', 6);

  insert into checklist_sections (template_id, section_no, title, display_order)
  values (v_template_id, '6', 'Centring gripper (option)', 6)
  returning id into v_section_id;

  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '6.1', 'General cleaning', 1);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '6.2', 'Check gripper device general state', 2);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '6.3', 'Check the bearings play', 3);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '6.4', 'Rail clean and lubrication', 4);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '6.5', 'Exchange the gripper fingers', 5);

  insert into checklist_sections (template_id, section_no, title, display_order)
  values (v_template_id, '7', 'Polarisation (option)', 7)
  returning id into v_section_id;

  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '7.1', 'General cleaning', 1);
  insert into checklist_items (section_id, item_no, text, display_order) values
  (v_section_id, '7.2', 'Check the ajdustment', 2);


end $$;

-- Summary
select
  t.machine_type || coalesce(' ' || t.version, '') as template,
  count(distinct s.id) as sections,
  count(i.id) as items
from checklist_templates t
left join checklist_sections s on s.template_id = t.id
left join checklist_items i on i.section_id = s.id
group by t.id, t.machine_type, t.version
order by t.machine_type, t.version;