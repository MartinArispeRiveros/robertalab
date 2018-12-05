package de.fhg.iais.roberta.syntax.actors.arduino;

import java.util.List;

import de.fhg.iais.roberta.blockly.generated.Block;
import de.fhg.iais.roberta.blockly.generated.Field;
import de.fhg.iais.roberta.blockly.generated.Mutation;
import de.fhg.iais.roberta.blockly.generated.Value;
import de.fhg.iais.roberta.factory.BlocklyDropdownFactory;
import de.fhg.iais.roberta.syntax.BlockTypeContainer;
import de.fhg.iais.roberta.syntax.BlocklyBlockProperties;
import de.fhg.iais.roberta.syntax.BlocklyComment;
import de.fhg.iais.roberta.syntax.BlocklyConstants;
import de.fhg.iais.roberta.syntax.Phrase;
import de.fhg.iais.roberta.syntax.action.Action;
import de.fhg.iais.roberta.syntax.lang.expr.Expr;
import de.fhg.iais.roberta.transformer.AbstractJaxb2Ast;
import de.fhg.iais.roberta.transformer.Ast2JaxbHelper;
import de.fhg.iais.roberta.transformer.ExprParam;
import de.fhg.iais.roberta.typecheck.BlocklyType;
import de.fhg.iais.roberta.util.dbc.Assert;
import de.fhg.iais.roberta.visitor.IVisitor;
import de.fhg.iais.roberta.visitor.hardware.IArduinoVisitor;

public class PinWriteValueAction<V> extends Action<V> {
    private final String mode;
    private final String port;
    private final Expr<V> value;

    private PinWriteValueAction(String mode, String port, Expr<V> value, BlocklyBlockProperties properties, BlocklyComment comment) {
        super(BlockTypeContainer.getByName("WRITE_TO_PIN"), properties, comment);
        Assert.notNull(mode);
        Assert.notNull(port);
        Assert.notNull(value);
        this.mode = mode;
        this.port = port;
        this.value = value;
        setReadOnly();
    }

    /**
     * Create object of the class {@link PinWriteValue}.
     *
     * @param pin
     * @param valueType see {@link PinValue}
     * @param properties of the block (see {@link BlocklyBlockProperties}),
     * @param comment added from the user,
     * @return read only object of {@link PinWriteValue}
     */
    public static <V> PinWriteValueAction<V> make(String mode, String port, Expr<V> value, BlocklyBlockProperties properties, BlocklyComment comment) {
        return new PinWriteValueAction<>(mode, port, value, properties, comment);
    }

    public String getMode() {
        return this.mode;
    }

    public String getPort() {
        return this.port;
    }

    public Expr<V> getValue() {
        return this.value;
    }

    @Override
    public String toString() {
        return "PinWriteValueSensor [" + this.mode + ", " + this.port + ", " + this.value + "]";
    }

    /**
     * Transformation from JAXB object to corresponding AST object.
     *
     * @param block for transformation
     * @param helper class for making the transformation
     * @return corresponding AST object
     */
    public static <V> Phrase<V> jaxbToAst(Block block, AbstractJaxb2Ast<V> helper) {
        BlocklyDropdownFactory factory = helper.getDropdownFactory();
        List<Field> fields = helper.extractFields(block, (short) 2);
        List<Value> values = helper.extractValues(block, (short) 1);
        String port = helper.extractField(fields, BlocklyConstants.ACTORPORT);
        String mode = helper.extractField(fields, BlocklyConstants.MODE);
        Phrase<V> value = helper.extractValue(values, new ExprParam(BlocklyConstants.VALUE, BlocklyType.NUMBER_INT));
        return PinWriteValueAction
            .make(
                factory.getMode(mode),
                factory.sanitizePort(port),
                helper.convertPhraseToExpr(value),
                helper.extractBlockProperties(block),
                helper.extractComment(block));
    }

    @Override
    public Block astToBlock() {
        Block jaxbDestination = new Block();
        Mutation mutation = new Mutation();
        mutation.setProtocol(this.mode.toString());
        jaxbDestination.setMutation(mutation);
        Ast2JaxbHelper.setBasicProperties(this, jaxbDestination);
        Ast2JaxbHelper.addValue(jaxbDestination, BlocklyConstants.VALUE, this.value);
        Ast2JaxbHelper.addField(jaxbDestination, BlocklyConstants.MODE, this.mode.toString());
        Ast2JaxbHelper.addField(jaxbDestination, BlocklyConstants.ACTORPORT, this.port);
        return jaxbDestination;
    }

    @Override
    protected V accept(IVisitor<V> visitor) {
        return ((IArduinoVisitor<V>) visitor).visitPinWriteValueAction(this);
    }

}
