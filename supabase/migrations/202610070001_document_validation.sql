begin;
create schema if not exists extensions;
create extension if not exists pg_jsonschema with schema extensions;
create extension if not exists pgcrypto with schema extensions;

create function public.project_document_schema_v1() returns json
language sql immutable set search_path = '' as $fn$
  select $schema$
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "schemaVersion": {
      "type": "number",
      "const": 1
    },
    "ruleSetId": {
      "type": "string",
      "const": "orthogonal-half-bond-v1"
    },
    "units": {
      "type": "string",
      "const": "mm"
    },
    "name": {
      "type": "string",
      "minLength": 1,
      "maxLength": 160,
      "pattern": "\\S"
    },
    "brickSystem": {
      "type": "object",
      "properties": {
        "lengthMm": {
          "type": "integer",
          "exclusiveMinimum": 0,
          "maximum": 9007199254740991
        },
        "widthMm": {
          "type": "integer",
          "exclusiveMinimum": 0,
          "maximum": 9007199254740991
        },
        "heightMm": {
          "type": "integer",
          "exclusiveMinimum": 0,
          "maximum": 9007199254740991
        },
        "horizontalJointMm": {
          "type": "integer",
          "minimum": 0,
          "maximum": 10
        },
        "verticalJointMm": {
          "type": "number",
          "const": 0
        }
      },
      "required": [
        "lengthMm",
        "widthMm",
        "heightMm",
        "horizontalJointMm",
        "verticalJointMm"
      ],
      "additionalProperties": false
    },
    "defaultWallHeightMm": {
      "type": "integer",
      "exclusiveMinimum": 0,
      "maximum": 9007199254740991
    },
    "wastePercent": {
      "type": "number",
      "minimum": 0,
      "maximum": 30
    },
    "floor": {
      "type": "object",
      "properties": {
        "id": {
          "type": "string",
          "format": "uuid",
          "pattern": "^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$"
        },
        "name": {
          "type": "string",
          "minLength": 1
        },
        "elevationMm": {
          "type": "number",
          "const": 0
        },
        "walls": {
          "maxItems": 100,
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "id": {
                "type": "string",
                "format": "uuid",
                "pattern": "^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$"
              },
              "label": {
                "type": "string"
              },
              "start": {
                "type": "object",
                "properties": {
                  "x": {
                    "type": "integer",
                    "minimum": -100000,
                    "maximum": 100000
                  },
                  "y": {
                    "type": "integer",
                    "minimum": -100000,
                    "maximum": 100000
                  }
                },
                "required": [
                  "x",
                  "y"
                ],
                "additionalProperties": false
              },
              "end": {
                "type": "object",
                "properties": {
                  "x": {
                    "type": "integer",
                    "minimum": -100000,
                    "maximum": 100000
                  },
                  "y": {
                    "type": "integer",
                    "minimum": -100000,
                    "maximum": 100000
                  }
                },
                "required": [
                  "x",
                  "y"
                ],
                "additionalProperties": false
              },
              "heightMm": {
                "type": "integer",
                "exclusiveMinimum": 0,
                "maximum": 9007199254740991
              },
              "phase": {
                "anyOf": [
                  {
                    "type": "number",
                    "const": 0
                  },
                  {
                    "type": "number",
                    "const": 1
                  }
                ]
              }
            },
            "required": [
              "id",
              "label",
              "start",
              "end",
              "heightMm",
              "phase"
            ],
            "additionalProperties": false
          }
        },
        "openings": {
          "maxItems": 100,
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "id": {
                "type": "string",
                "format": "uuid",
                "pattern": "^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$"
              },
              "label": {
                "type": "string"
              },
              "wallId": {
                "type": "string",
                "format": "uuid",
                "pattern": "^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$"
              },
              "kind": {
                "type": "string",
                "enum": [
                  "door",
                  "window"
                ]
              },
              "offsetMm": {
                "type": "integer",
                "minimum": 0,
                "maximum": 9007199254740991
              },
              "widthMm": {
                "type": "integer",
                "exclusiveMinimum": 0,
                "maximum": 9007199254740991
              },
              "heightMm": {
                "type": "integer",
                "exclusiveMinimum": 0,
                "maximum": 9007199254740991
              },
              "sillMm": {
                "type": "integer",
                "minimum": 0,
                "maximum": 9007199254740991
              },
              "hinge": {
                "type": "string",
                "enum": [
                  "start",
                  "end"
                ]
              },
              "swingSide": {
                "type": "string",
                "enum": [
                  "left",
                  "right"
                ]
              }
            },
            "required": [
              "id",
              "label",
              "wallId",
              "kind",
              "offsetMm",
              "widthMm",
              "heightMm",
              "sillMm"
            ],
            "additionalProperties": false
          }
        },
        "dimensions": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "id": {
                "type": "string",
                "format": "uuid",
                "pattern": "^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$"
              },
              "axis": {
                "type": "string",
                "enum": [
                  "x",
                  "y"
                ]
              },
              "from": {
                "oneOf": [
                  {
                    "type": "object",
                    "properties": {
                      "kind": {
                        "type": "string",
                        "const": "wallEndpoint"
                      },
                      "wallId": {
                        "type": "string",
                        "format": "uuid",
                        "pattern": "^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$"
                      },
                      "endpoint": {
                        "type": "string",
                        "enum": [
                          "start",
                          "end"
                        ]
                      }
                    },
                    "required": [
                      "kind",
                      "wallId",
                      "endpoint"
                    ],
                    "additionalProperties": false
                  },
                  {
                    "type": "object",
                    "properties": {
                      "kind": {
                        "type": "string",
                        "const": "openingEdge"
                      },
                      "openingId": {
                        "type": "string",
                        "format": "uuid",
                        "pattern": "^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$"
                      },
                      "edge": {
                        "type": "string",
                        "enum": [
                          "start",
                          "end"
                        ]
                      }
                    },
                    "required": [
                      "kind",
                      "openingId",
                      "edge"
                    ],
                    "additionalProperties": false
                  }
                ]
              },
              "to": {
                "oneOf": [
                  {
                    "type": "object",
                    "properties": {
                      "kind": {
                        "type": "string",
                        "const": "wallEndpoint"
                      },
                      "wallId": {
                        "type": "string",
                        "format": "uuid",
                        "pattern": "^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$"
                      },
                      "endpoint": {
                        "type": "string",
                        "enum": [
                          "start",
                          "end"
                        ]
                      }
                    },
                    "required": [
                      "kind",
                      "wallId",
                      "endpoint"
                    ],
                    "additionalProperties": false
                  },
                  {
                    "type": "object",
                    "properties": {
                      "kind": {
                        "type": "string",
                        "const": "openingEdge"
                      },
                      "openingId": {
                        "type": "string",
                        "format": "uuid",
                        "pattern": "^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$"
                      },
                      "edge": {
                        "type": "string",
                        "enum": [
                          "start",
                          "end"
                        ]
                      }
                    },
                    "required": [
                      "kind",
                      "openingId",
                      "edge"
                    ],
                    "additionalProperties": false
                  }
                ]
              },
              "offsetMm": {
                "type": "integer",
                "minimum": -9007199254740991,
                "maximum": 9007199254740991
              }
            },
            "required": [
              "id",
              "axis",
              "from",
              "to",
              "offsetMm"
            ],
            "additionalProperties": false
          }
        }
      },
      "required": [
        "id",
        "name",
        "elevationMm",
        "walls",
        "openings",
        "dimensions"
      ],
      "additionalProperties": false
    }
  },
  "required": [
    "schemaVersion",
    "ruleSetId",
    "units",
    "name",
    "brickSystem",
    "defaultWallHeightMm",
    "wastePercent",
    "floor"
  ],
  "additionalProperties": false
}
$schema$::json;
$fn$;

-- Validação estrutural e referências, sem rejeitar incompatibilidades geométricas editáveis.
create function public.validate_project_document(p_document jsonb) returns void
language plpgsql immutable set search_path = '' as $fn$
declare
  v_floor jsonb;
  v_course numeric;
  v_entity jsonb;
  v_anchor jsonb;
  v_ids text[];
  v_walls text[];
  v_openings text[];
begin
  if p_document is null then raise exception 'INVALID_DOCUMENT'; end if;
  if octet_length(convert_to(p_document::text, 'UTF8')) > 5242880 then raise exception 'DOCUMENT_TOO_LARGE'; end if;
  if not extensions.jsonb_matches_schema(public.project_document_schema_v1(), p_document) then
    raise exception 'INVALID_DOCUMENT';
  end if;
  if (p_document #>> '{brickSystem,lengthMm}')::numeric <> 2 * (p_document #>> '{brickSystem,widthMm}')::numeric then
    raise exception 'INVALID_DOCUMENT';
  end if;
  v_course := (p_document #>> '{brickSystem,heightMm}')::numeric + (p_document #>> '{brickSystem,horizontalJointMm}')::numeric;
  if floor((p_document->>'defaultWallHeightMm')::numeric / v_course) > 60 then raise exception 'INVALID_DOCUMENT'; end if;
  v_floor := p_document->'floor';
  select coalesce(array_agg(lower(value->>'id')), array[]::text[]) into v_walls from jsonb_array_elements(v_floor->'walls');
  select coalesce(array_agg(lower(value->>'id')), array[]::text[]) into v_openings from jsonb_array_elements(v_floor->'openings');
  select array[lower(v_floor->>'id')] || v_walls || v_openings || coalesce(array_agg(lower(value->>'id')), array[]::text[]) into v_ids from jsonb_array_elements(v_floor->'dimensions');
  if cardinality(v_ids) <> (select count(distinct id) from unnest(v_ids) as t(id)) then raise exception 'INVALID_DOCUMENT'; end if;
  for v_entity in select value from jsonb_array_elements(v_floor->'walls') loop
    if floor((v_entity->>'heightMm')::numeric / v_course) > 60 then raise exception 'INVALID_DOCUMENT'; end if;
  end loop;
  for v_entity in select value from jsonb_array_elements(v_floor->'openings') loop
    if not (lower(v_entity->>'wallId') = any(v_walls)) then raise exception 'INVALID_DOCUMENT'; end if;
    if v_entity->>'kind' = 'door' and (v_entity->>'sillMm')::numeric <> 0 then raise exception 'INVALID_DOCUMENT'; end if;
  end loop;
  for v_entity in select value from jsonb_array_elements(v_floor->'dimensions') loop
    for v_anchor in select value from jsonb_array_elements(jsonb_build_array(v_entity->'from', v_entity->'to')) loop
      if v_anchor->>'kind' = 'wallEndpoint' then
        if not (lower(v_anchor->>'wallId') = any(v_walls)) then raise exception 'INVALID_DOCUMENT'; end if;
      else
        if not (lower(v_anchor->>'openingId') = any(v_openings)) then raise exception 'INVALID_DOCUMENT'; end if;
      end if;
    end loop;
  end loop;
  if exists (
    select 1 from (
      select (point->>'x')::numeric as x, (point->>'y')::numeric as y
      from jsonb_array_elements(v_floor->'walls') as w(value)
      cross join lateral jsonb_array_elements(jsonb_build_array(w.value->'start', w.value->'end')) as p(point)
    ) as points having max(x) - min(x) > 100000 or max(y) - min(y) > 100000
  ) then raise exception 'INVALID_DOCUMENT'; end if;
end;
$fn$;

revoke all on function public.project_document_schema_v1() from public, anon, authenticated;
revoke all on function public.validate_project_document(jsonb) from public, anon, authenticated;
commit;
