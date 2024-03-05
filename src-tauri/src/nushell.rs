use nu_engine::eval_block;
use nu_parser::parse;
use nu_protocol::{
    engine::{EngineState, Stack, StateWorkingSet},
    PipelineData, ShellError, Span, Value,
};

pub fn eval_nushell(
    engine_state: &mut EngineState,
    stack: &mut Stack,
    source: &[u8],
    fname: &str,
    input: PipelineData,
) -> Result<PipelineData, ShellError> {
    let (block, delta) = {
        let mut working_set = StateWorkingSet::new(engine_state);
        let output = parse(&mut working_set, Some(fname), source, false);

        (output, working_set.render())
    };

    engine_state.merge_delta(delta)?;

    eval_block(engine_state, stack, &block, input, false, true)
}

/// Evaluate a block of Nu code, optionally with input.
/// For example, source="$in * 2" will multiply the value in input by 2.
pub fn simple_eval(
    engine_state: &mut EngineState,
    stack: &mut Stack,
    input: Option<Value>,
    source: &str,
) -> Result<Value, ShellError> {
    let (block, delta) = {
        let mut working_set = StateWorkingSet::new(engine_state);
        let output = parse(&mut working_set, Some("nana"), source.as_bytes(), false);
        (output, working_set.render())
    };

    engine_state.merge_delta(delta)?;

    let input_as_pipeline_data = match input {
        Some(input) => PipelineData::Value(input, None),
        None => PipelineData::empty(),
    };

    eval_block(
        engine_state,
        stack,
        &block,
        input_as_pipeline_data,
        false,
        true,
    )
    .map(|x| x.into_value(Span::unknown()))
}
